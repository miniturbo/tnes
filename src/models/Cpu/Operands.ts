import { Memoize } from 'typescript-memoize'
import { CpuOperand } from '/@/types'
import { divideIntoBytes, validateNonNullable } from '/@/utils'

export class Operands {
  constructor(private operands: CpuOperand[], readonly isPageCrossed: boolean) {}

  @Memoize()
  get operand(): CpuOperand {
    const operand = this.operands.slice(-1)[0]

    validateNonNullable(operand)

    return operand
  }

  @Memoize()
  get fetchedOperands(): CpuOperand[] {
    const operand = this.operands[0]

    if (operand === undefined) {
      return []
    } else if (operand > 0xff) {
      return divideIntoBytes(operand)
    } else {
      return [operand]
    }
  }

  @Memoize()
  get intermediateOperands(): CpuOperand[] {
    return this.operands.slice(0, -1)
  }
}
