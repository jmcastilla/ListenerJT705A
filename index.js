const net = require('net');

const PORT = 9010;
const HOST = '157.230.211.213';

const server = net.createServer(socket => {
    console.log(`📡 Cliente conectado desde: ${socket.remoteAddress}`);

    socket.on('data', data => {
        let hexData = data.toString('hex');

        console.log(`📩 Datos recibidos: ${hexData}`);

        // Extraer los parámetros del protocolo
        let messageID = hexData.substring(2, 6);
        let deviceID = hexData.substring(10, 22);
        let msgSerialNumber = parseInt(hexData.substring(22, 24), 16);
        let date = formatDate(hexData.substring(24, 30));
        let time = formatTime(hexData.substring(30, 36));
        let latitude = parseLatitude(hexData.substring(36, 44));
        let longitude = parseLongitude(hexData.substring(44, 53));
        let speed = parseInt(hexData.substring(54, 56), 16) * 1.85;
        let direction = parseInt(hexData.substring(56, 58), 16) * 2;
        let batteryLevel = parseInt(hexData.substring(70, 72), 16);
        let deviceStatus = parseDeviceStatus(hexData.substring(86, 90));
        let alarmStatus = parseAlarmStatus(hexData.substring(90, 94));

        // Mostrar resultados en consola
        console.log(`📍 Dispositivo: ${deviceID}`);
        console.log(`📆 Fecha UTC: ${date}`);
        console.log(`🕒 Hora UTC: ${time}`);
        console.log(`🌍 Latitud: ${latitude}, Longitud: ${longitude}`);
        console.log(`🚀 Velocidad: ${speed} km/h`);
        console.log(`🧭 Dirección: ${direction}°`);
        console.log(`🔋 Batería: ${batteryLevel}%`);
        console.log(`⚠️ Estado del Dispositivo:`, deviceStatus);
        console.log(`🚨 Alarmas Activas:`, alarmStatus);

        // Si el mensaje requiere respuesta, enviar confirmación
        if (messageID === '5501' || messageID === '5502') {
            let response = buildResponse(deviceID, msgSerialNumber, messageID);
            socket.write(response);
            console.log(`📡 Respuesta enviada: ${response.toString('hex')}`);
        }
    });

    socket.on('close', () => console.log('❌ Cliente desconectado.'));
    socket.on('error', err => console.error(`🚨 Error en socket: ${err.message}`));
});

server.listen(PORT, HOST, () => {
    console.log(`✅ Servidor escuchando en ${HOST}:${PORT}`);
});

// Convierte latitud de formato BCD a decimal
function parseLatitude(hex) {
    let grados = parseInt(hex.substring(0, 2), 10);
    let minutos = parseInt(hex.substring(2), 10) / 10000 / 60;
    return (grados + minutos).toFixed(8);
}

// Convierte longitud de formato BCD a decimal
function parseLongitude(hex) {
    let grados = parseInt(hex.substring(0, 3), 10);
    let minutos = parseInt(hex.substring(3), 10) / 10000 / 60;
    return (grados + minutos).toFixed(8);
}

// Convierte fecha BCD (DDMMYY) a formato legible
function formatDate(hex) {
    return `20${hex.substring(4, 6)}-${hex.substring(2, 4)}-${hex.substring(0, 2)}`;
}

// Convierte hora BCD (HHMMSS) a formato legible
function formatTime(hex) {
    return `${hex.substring(0, 2)}:${hex.substring(2, 4)}:${hex.substring(4, 6)}`;
}

// Convierte `Device Status` en un objeto con valores booleanos
function parseDeviceStatus(hexString) {
    let binaryStatus = parseInt(hexString, 16).toString(2).padStart(16, '0');

    return {
        bateria_baja: binaryStatus[14] === '1',
        tapa_abierta: binaryStatus[13] === '1',
        motor_desbloqueado: binaryStatus[11] === '1',
        boton_desbloqueo: binaryStatus[10] === '1',
        bluetooth_conectado: binaryStatus[4] === '1',
    };
}

// Convierte `Alarm Sign` en un objeto con valores booleanos
function parseAlarmStatus(hexString) {
    let binaryAlarm = parseInt(hexString, 16).toString(2).padStart(16, '0');

    return {
        exceso_velocidad: binaryAlarm[15] === '1',
        bateria_baja: binaryAlarm[14] === '1',
        vibracion_detectada: binaryAlarm[13] === '1',
        deep_sleep: binaryAlarm[12] === '1',
        entrada_geocerca: binaryAlarm[10] === '1',
        salida_geocerca: binaryAlarm[9] === '1',
        desbloqueo_incorrecto: binaryAlarm[8] === '1',
    };
}

// Construye la respuesta de confirmación `[4401]`
function buildResponse(deviceID, msgSerialNumber, messageID) {
    let response = `7E44010003${deviceID}01${messageID}00`;
    let xor = calculateXOR(response);
    return Buffer.from(response + xor + '7E', 'hex');
}

// Calcula el XOR del mensaje para la verificación
function calculateXOR(hexString) {
    return hexString.match(/.{1,2}/g)
        .map(byte => parseInt(byte, 16))
        .reduce((acc, val) => acc ^ val, 0)
        .toString(16)
        .padStart(2, '0')
        .toUpperCase();
}
