import Register from '/@/models/Register'

describe('Register', () => {
  describe('#increment', () => {
    it('値がインクリメントされること', () => {
      const register = new Register(0x0)
      register.increment()
      expect(register.read()).toBe(0x1)
    })
  })
})
