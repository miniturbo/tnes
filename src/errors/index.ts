abstract class AbstractError extends Error {
  constructor(message?: string) {
    super(message)
    this.name = new.target.name
    Object.setPrototypeOf(this, new.target.prototype)
  }
}

export class BadAddressError extends AbstractError {
  constructor(address: unknown) {
    super(`Bad address: ${address}`)
  }
}

export class NullableError extends AbstractError {
  constructor(value: unknown) {
    super(`Expected value to be non nullable, but received: ${value}`)
  }
}

export class UnknownAddressingModeError extends AbstractError {
  constructor(addressingMode: unknown) {
    super(`Unknown addressing mode: ${addressingMode}`)
  }
}

export class UnknownInstructionTypeError extends AbstractError {
  constructor(instructionType: unknown) {
    super(`Unknown instruction type: ${instructionType}`)
  }
}

export class UnknownOpcodeError extends AbstractError {
  constructor(opcode: unknown) {
    super(`Unknown opcode: ${opcode}`)
  }
}
