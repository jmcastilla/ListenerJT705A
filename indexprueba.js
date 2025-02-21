const net = require('net');

processGPSMessage("7E55019C3B8580120308366D21022503423000000000000000000600001A0000000003630033A702753B0308000000100102020200000A0402DC0065F401040C0600210057FAB10C7E");

function processGPSMessage(hexData) {
    hexData = restoreEscapeCharacters(hexData);
    console.log(`Datos recibidos: ${hexData}`);

    // Extraer los parámetros del protocolo
    let messageID = hexData.substring(2, 6);
    let deviceID = hexData.substring(10, 22);
    let msgSerialNumber = parseInt(hexData.substring(22, 24), 16);

    // Si el mensaje requiere respuesta, enviar confirmación
    if (messageID === '5501' || messageID === '5502') {
        let response = buildResponse(deviceID, msgSerialNumber, messageID);

        console.log(`Respuesta enviada: ${response.toString('hex')}`);
    }
}





function buildResponse(deviceID, msgSerialNumber, messageID) {
    let messageIDResponse = '4401';  // Código de respuesta
    let messageLength = '0003';      // Longitud fija de 5 bytes
    let exito = '00';
    // Construcción del mensaje SIN `0x7E` al inicio y fin
    let responseBody = `${messageIDResponse}${messageLength}${deviceID}01${messageID}${exito}`;
    console.log(responseBody);
    // 📌 Calcular el XOR antes del escape
    let xor = calculateXOR(responseBody);
    console.log("xor: ", xor);

    // 📌 Aplicar escape a `0x7E` y `0x7D`
    let escapedBody = applyEscapeCharacters(`${responseBody}${xor}`);

    // 📌 Mensaje final con `0x7E` delimitador
    let response = `7E${escapedBody}7E`;
    console.log(response);
    return Buffer.from(response, 'hex');
}

// Calcula el XOR del mensaje para la verificación
/*function calculateXOR(hexString) {
    return hexString.match(/.{1,2}/g)
        .map(byte => parseInt(byte, 16))
        .reduce((acc, val) => acc ^ val, 0)
        .toString(16)
        .padStart(2, '0')
        .toUpperCase();
}*/
function calculateXOR(hexString) {
    let xor = 0;

    // 📌 Convertir la cadena HEX a un buffer de bytes
    let bytes = Buffer.from(hexString, 'hex');

    // 📌 Aplicar XOR a cada byte
    for (let i = 0; i < bytes.length; i++) {
        xor ^= bytes[i];
    }

    // 📌 Retornar el resultado en HEX (2 caracteres, mayúscula)
    return xor.toString(16).padStart(2, '0').toUpperCase();
}




/*function calculateXOR(hexString) {
    let lista = [];

    // Dividir la cadena en pares de caracteres HEX
    for (let i = 0; i < hexString.length; i += 2) {
        lista.push(hexString.substring(i, i + 2));
    }

    // Aplicar XOR entre todos los valores
    let valorInicial = lista[0];
    for (let i = 1; i < lista.length; i++) {
        valorInicial = xorHex(valorInicial, lista[i]);
    }

    return valorInicial.toUpperCase().padStart(2, '0'); // Retorna siempre 2 caracteres en mayúscula
}*/

function xorHex(a, b) {
    let aByte = parseInt(a, 16);
    let bByte = parseInt(b, 16);
    let result = aByte ^ bByte;
    return result.toString(16).padStart(2, '0').toUpperCase();
}

function applyEscapeCharacters(hexString) {
    return hexString.replace(/7E/g, '7D02').replace(/7D/g, '7D01');
}

function restoreEscapeCharacters(hexString) {
    return hexString.replace(/7D02/g, '7E').replace(/7D01/g, '7D');
}
