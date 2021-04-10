import Uint8Register from '/@/models/Uint8Register'

describe('Register', () => {
  describe('#inspect', () => {
    it('値が16進数表記で返却されること', () => {
      const uint8Register = new Uint8Register(0xff)
      expect(uint8Register.inspect()).toBe('$ff')
    })
  })
})
