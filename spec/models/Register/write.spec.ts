import Register from '/@/models/Register'

describe('Register', () => {
  describe('#write', () => {
    it('値が書き込めること', () => {
      const register = new Register()
      register.write(0x1)
      expect(register.read()).toBe(0x1)
    })
  })
})
