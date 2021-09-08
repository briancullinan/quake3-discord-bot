
function bufferToArrayBuffer(buffer) {
  var arrayBuffer = new ArrayBuffer(buffer.length);
  var typedArray = new Uint8Array(arrayBuffer);
  for (var i = 0; i < buffer.length; ++i) {
      typedArray[i] = buffer[i];
  }
  return arrayBuffer
}

module.exports = bufferToArrayBuffer
