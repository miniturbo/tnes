import Uint16Register from '/@/models/Uint16Register'

describe('Register', () => {
  describe('#inspect', () => {
    it('値が16進数表記で返却されること', () => {
      const uint16Register = new Uint16Register(0xffff)
      expect(uint16Register.inspect()).toBe('$ffff')
    })
  })
})
