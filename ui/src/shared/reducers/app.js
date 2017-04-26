import {combineReducers} from 'redux'

import {AUTOREFRESH_DEFAULT} from 'src/shared/constants'

const initialState = {
  ephemeral: {
    inPresentationMode: false,
  },
  persisted: {
    autoRefresh: AUTOREFRESH_DEFAULT,
  },
}

const {
  ephemeral: initialAppEphemeralState,
  persisted: initialAppPersistedState,
} = initialState

const appEphemeralReducer = (state = initialAppEphemeralState, action) => {
  switch (action.type) {
    case 'ENABLE_PRESENTATION_MODE': {
      return {
        ...state,
        inPresentationMode: true,
      }
    }

    case 'DISABLE_PRESENTATION_MODE': {
      return {
        ...state,
        inPresentationMode: false,
      }
    }

    default:
      return state
  }
}

const appPersistedReducer = (state = initialAppPersistedState, action) => {
  switch (action.type) {
    case 'SET_AUTOREFRESH': {
      return {
        ...state,
        autoRefresh: action.payload.milliseconds,
      }
    }

    default:
      return state
  }
}

const appReducer = combineReducers({
  ephemeral: appEphemeralReducer,
  persisted: appPersistedReducer,
})

export default appReducer
