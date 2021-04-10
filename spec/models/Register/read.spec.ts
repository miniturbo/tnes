import Register from '/@/models/Register'

describe('Register', () => {
  describe('#read', () => {
    it('値が返却されること', () => {
      const register = new Register(0x1)
      expect(register.read()).toBe(0x1)
    })
  })
})
