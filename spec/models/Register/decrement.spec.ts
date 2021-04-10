import Register from '/@/models/Register'

describe('Register', () => {
  describe('#decrement', () => {
    it('値がデクリメントされること', () => {
      const register = new Register(0x1)
      register.decrement()
      expect(register.read()).toBe(0x0)
    })
  })
})
