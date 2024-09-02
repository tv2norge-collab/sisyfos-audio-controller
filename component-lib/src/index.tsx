export { useSocketConnection } from '../../client/src/hooks/useSocketConnection'
export { default as ContextProvider } from '../../client/src/components/ContextProvider'
import React from 'react'

import { default as OrgChannels } from '../../client/src/components/Channels'

export function Channels({page} : { page?: string }) {
    return <OrgChannels page={page}/>
}
