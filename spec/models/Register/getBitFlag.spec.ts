import Register from '/@/models/Register'

describe('Register', () => {
  let register: Register

  describe('#getBitFlag', () => {
    describe('指定したインデックスに該当するビットが0の場合', () => {
      beforeEach(() => {
        register = new Register(0b0)
      })

      it('falseが返却されること', () => {
        expect(register.getBitFlag(0)).toBe(false)
      })
    })

    describe('指定したインデックスに該当するビットが1の場合', () => {
      beforeEach(() => {
        register = new Register(0b1)
      })

      it('trueが返却されること', () => {
        expect(register.getBitFlag(0)).toBe(true)
      })
    })
  })
})
