import Register from '/@/models/Register'

describe('Register', () => {
  let register: Register

  beforeEach(() => {
    register = new Register(0b10)
  })

  describe('#readBit', () => {
    let index: number

    describe('インデックスに0を指定した場合', () => {
      beforeEach(() => {
        index = 0
      })

      it('1番目のビットが返却されること', () => {
        expect(register.readBit(index)).toBe(0b0)
      })
    })

    describe('インデックスに1を指定した場合', () => {
      beforeEach(() => {
        index = 1
      })

      it('2番目のビットが返却されること', () => {
        expect(register.readBit(index)).toBe(0b1)
      })
    })
  })
})
