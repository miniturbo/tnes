import Register from '/@/models/Register'
import Uint8Register from '/@/models/Uint8Register'

describe('Uint8Register', () => {
  describe('.new', () => {
    describe('継承', () => {
      it('Registerから継承していること', () => {
        const uint8Register = new Uint8Register()
        expect(uint8Register).toBeInstanceOf(Register)
      })
    })

    describe('1バイトを超える値を指定した場合', () => {
      it('1バイトに丸め込まれること', () => {
        const uint8Register = new Uint8Register(0x100)
        expect(uint8Register.read()).toBe(0x00)
      })
    })
  })
})
