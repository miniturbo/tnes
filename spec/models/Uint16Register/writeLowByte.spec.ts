import Uint16Register from '/@/models/Uint16Register'

describe('Register', () => {
  describe('#write', () => {
    let uint16Register: Uint16Register

    beforeEach(() => {
      uint16Register = new Uint16Register(0x0000)
    })

    describe('1バイト以下の値を指定した場合', () => {
      it('下位バイトに値が書き込めること', () => {
        uint16Register.writeLowByte(0xff)
        expect(uint16Register.read()).toBe(0x00ff)
      })
    })

    describe('1バイトを超える値を指定した場合', () => {
      it('1バイトに丸め込まれて下位バイトに値が書き込めること', () => {
        uint16Register.writeLowByte(0xffff)
        expect(uint16Register.read()).toBe(0x00ff)
      })
    })
  })
})
