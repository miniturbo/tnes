import Register from '/@/models/Register'
import Uint16Register from '/@/models/Uint16Register'

describe('Uint16Register', () => {
  describe('.new', () => {
    describe('継承', () => {
      it('Registerから継承していること', () => {
        const uint16Register = new Uint16Register()
        expect(uint16Register).toBeInstanceOf(Register)
      })
    })

    describe('2バイトを超える値を指定した場合', () => {
      it('2バイトに丸め込まれること', () => {
        const uint16Register = new Uint16Register(0x10000)
        expect(uint16Register.read()).toBe(0x0000)
      })
    })
  })
})
