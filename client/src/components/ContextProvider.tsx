import React from "react";
import { useSocketConnection } from "../hooks/useSocketConnection";
import { I18nextProvider } from "react-i18next";
import i18n from "../utils/i18n";
import storeRedux from '../../../shared/src/reducers/store'
import { Provider as ReduxProvider } from 'react-redux'

const ContextProvider = ({ children, uri, path, query }: { children: React.ReactNode, uri?: string, path?: string, query?: Record<string, string> }) => {
    const { initialized } = useSocketConnection(uri, path, query)

    return <ReduxProvider store={storeRedux}>
        <I18nextProvider i18n={i18n}>
            {initialized && children}
        </I18nextProvider>
    </ReduxProvider>

};

export default ContextProvider;
