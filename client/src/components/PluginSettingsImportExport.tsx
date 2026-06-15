import React from 'react'

interface PluginSettingsImportExportProps {
    pluginId: string
    mixerIndex: number
    canImportExport: boolean
    currentOptions: Record<string, unknown>
    onImportedOptions: (options: Record<string, unknown>) => void
}

const PluginSettingsImportExport: React.FC<PluginSettingsImportExportProps> = ({
    pluginId,
    mixerIndex,
    canImportExport,
    currentOptions,
    onImportedOptions,
}) => {
    const importInputRef = React.useRef<HTMLInputElement>(null)

    const getPluginImportUrl = () =>
        `/api/plugin-settings/${encodeURIComponent(pluginId)}/${mixerIndex}`

    const exportPluginSettings = () => {
        try {
            const filename = `${pluginId}-mixer-${mixerIndex}-settings.json`
            const blob = new Blob([JSON.stringify(currentOptions, null, 2)], {
                type: 'application/json',
            })
            const url = window.URL.createObjectURL(blob)
            const link = document.createElement('a')
            link.href = url
            link.download = filename
            document.body.appendChild(link)
            link.click()
            document.body.removeChild(link)
            window.URL.revokeObjectURL(url)
        } catch (_error) {
            window.alert('Failed to export plugin settings')
        }
    }

    const importPluginSettings = async (
        event: React.ChangeEvent<HTMLInputElement>
    ) => {
        const file = event.target.files?.[0]
        event.target.value = ''
        if (!file) return

        try {
            const text = await file.text()
            const parsed = JSON.parse(text)
            const response = await fetch(getPluginImportUrl(), {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(parsed),
            })

            if (!response.ok) {
                const errorText = await response.text()
                window.alert(errorText || 'Failed to import plugin settings')
                return
            }

            const importedOptions = (await response.json()) as Record<
                string,
                unknown
            >
            onImportedOptions(importedOptions)
        } catch (_error) {
            window.alert('Failed to import plugin settings')
        }
    }

    if (!canImportExport) {
        return null
    }

    return (
        <>
            <div className="settings-input-field">
                <button
                    className="settings-plugin-import-export-button"
                    type="button"
                    onClick={exportPluginSettings}
                >
                    Export settings
                </button>
                <button
                    className="settings-plugin-import-export-button"
                    type="button"
                    onClick={() => importInputRef.current?.click()}
                >
                    Import settings
                </button>
                <input
                    ref={importInputRef}
                    type="file"
                    accept=".json,application/json"
                    style={{ display: 'none' }}
                    onChange={importPluginSettings}
                />
            </div>
            <br />
        </>
    )
}

export default PluginSettingsImportExport
