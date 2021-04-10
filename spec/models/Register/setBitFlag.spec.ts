import Register from '/@/models/Register'

describe('Register', () => {
  let register: Register

  beforeEach(() => {
    register = new Register()
  })

  describe('#setBitFlag', () => {
    let index: number
    let flag: boolean

    describe('インデックスに0を指定した場合', () => {
      beforeEach(() => {
        index = 0
      })

      describe('フラグにtrueを指定した場合', () => {
        beforeEach(() => {
          flag = true
        })

        it('1番目のビットフラグが立つこと', () => {
          register.setBitFlag(index, flag)
          expect(register.read()).toBe(0b1)
        })
      })

      describe('フラグにfalseを指定した場合', () => {
        beforeEach(() => {
          flag = false
        })

        it('1番目のビットフラグが下りること', () => {
          register.setBitFlag(index, flag)
          expect(register.read()).toBe(0b0)
        })
      })
    })

    describe('インデックスに1を指定した場合', () => {
      beforeEach(() => {
        index = 1
      })

      describe('フラグにtrueを指定した場合', () => {
        beforeEach(() => {
          flag = true
        })

        it('2番目のビットフラグが立つこと', () => {
          register.setBitFlag(index, flag)
          expect(register.read()).toBe(0b10)
        })
      })

      describe('フラグにfalseを指定した場合', () => {
        beforeEach(() => {
          flag = false
        })

        it('2番目のビットフラグが下りること', () => {
          register.setBitFlag(index, flag)
          expect(register.read()).toBe(0b00)
        })
      })
    })
  })
})
