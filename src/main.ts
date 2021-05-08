import 'bulma/css/bulma.css'
import { createApp } from 'vue'
import { library } from '@fortawesome/fontawesome-svg-core'
import {
  faChevronRight,
  faFastForward,
  faPlay,
  faPowerOff,
  faRedoAlt,
  faStepForward,
  faStop,
  faTools,
  faVideo,
} from '@fortawesome/free-solid-svg-icons'
import { FontAwesomeIcon } from '@fortawesome/vue-fontawesome'
import App from '/@/App.vue'
import { NesKey, useNes } from '/@/composables/useNes'
import { NesCanvasKey, useNesCanvas } from '/@/composables/useNesCanvas'
import { NesDebugKey, useNesDebug } from '/@/composables/useNesDebug'

library.add(faChevronRight, faFastForward, faPlay, faPowerOff, faRedoAlt, faStepForward, faStop, faTools, faVideo)

createApp(App)
  .component('font-awesome-icon', FontAwesomeIcon)
  .provide(NesKey, useNes())
  .provide(NesCanvasKey, useNesCanvas())
  .provide(NesDebugKey, useNesDebug())
  .mount('#app')
