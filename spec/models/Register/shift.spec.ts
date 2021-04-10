import Register from '/@/models/Register'

describe('Register', () => {
  describe('#shift', () => {
    it('値が左シフトされること', () => {
      const register = new Register(0b1)
      register.shift()
      expect(register.read()).toBe(0b10)
    })
  })
})
