/**
 * @class ArrayFrozenProcessor
 * @extends AudioWorkletProcessor
 */
class ArrayFrozenProcessor extends AudioWorkletProcessor {
  constructor() {
    super();
    this._messageSent = false;
  }

  process(inputs, outputs, parameters) {
    const input = inputs[0];
    const output = outputs[0];

    if (!this._messageSent) {
      this.port.postMessage({
        inputLength: input.length,
        isInputFrozen: Object.isFrozen(inputs) && Object.isFrozen(input),
        outputLength: output.length,
        isOutputFrozen: Object.isFrozen(outputs) && Object.isFrozen(output)
      });
      this._messageSent = true;
    }

    return false;
  }
}

/**
 * @class ArrayTransferProcessor
 * @extends AudioWorkletProcessor
 */
class ArrayTransferProcessor extends AudioWorkletProcessor {
  constructor() {
    super();
    this._messageSent = false;
  }

  process(inputs, outputs, parameters) {
    const input = inputs[0];
    const output = outputs[0];

    if (!this._messageSent) {
      try {
        this.port.postMessage({
          inputs, input, inputChannel: input[0],
          outputs, output, outputChannel: output[0]
        }, [inputs, input, inputs[0], outputs, output, output[0]]);
        // This must NOT be reached.
        this.port.postMessage({
          type: 'assertion',
          success: false,
          message: 'Transferring inputs/outputs, an individual input/output ' +
              'array, or a channel Float32Array MUST fail, but succeeded.'
        });
      } catch (error) {
        this.port.postMessage({
          type: 'assertion',
          success: true,
          message: 'Transferring inputs/outputs, an individual input/output ' +
              'array, or a channel Float32Array is not allowed correctly.'
        });
      }

      try {
        // This should succeed and not crash because of the neutered array
        // buffer.
        this.port.postMessage(
          {inputChannel: input[0], outputChannel: output[0]},
          [input[0].buffer, output[0].buffer]);
        this.port.postMessage({
          type: 'assertion',
          success: true,
          message: 'Transferring ArrayBuffers was successful.'
        });
      } catch (error) {
        // This must NOT be reached.
        this.port.postMessage({
          type: 'assertion',
          success: false,
          message: 'Transferring inputs/outputs, an individual input/output ' +
              'array, or a channel Float32Array MUST fail, but succeeded.'
        });
      }

      this.port.postMessage({done: true});
      this._messageSent = true;
    }

    return false;
  }
}

registerProcessor('array-frozen-processor', ArrayFrozenProcessor);
registerProcessor('array-transfer-processor', ArrayTransferProcessor);
