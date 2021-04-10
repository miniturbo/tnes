import Register from '/@/models/Register'

describe('Register', () => {
  describe('.new', () => {
    describe('値が指定されていない場合', () => {
      it('値が0になっていること', () => {
        const register = new Register()
        expect(register.read()).toBe(0x0)
      })
    })

    describe('値を指定した場合', () => {
      it('値が指定したものになっていること', () => {
        const register = new Register(0x1)
        expect(register.read()).toBe(0x1)
      })
    })
  })
})
