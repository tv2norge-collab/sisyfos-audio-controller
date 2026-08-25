import { InputSelectorPluginFactory } from '../InputSelectorPlugin'
import { DigigramInputSelectorPlugin } from './DigigramInputSelectorPlugin'
import { defaultDigigramInputSelectorOptions } from '../../../../../shared/src/inputSelectorPlugins/digigram/DigigramInputSelectorPluginOptions'

const digigramFactory: InputSelectorPluginFactory = (
    pluginOptions,
    context
) => {
    const options = {
        ...defaultDigigramInputSelectorOptions,
        ...(pluginOptions as object),
    }
    return new DigigramInputSelectorPlugin(options, context)
}

export const digigramInputSelectorPluginDefinition = {
    manifest: {
        pluginId: 'digigram',
        label: 'Digigram ALP',
    },
    factory: digigramFactory,
}
