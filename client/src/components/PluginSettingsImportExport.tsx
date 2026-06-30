import React from 'react'

interface PluginSettingsImportExportProps {
    pluginId: string
    mixerIndex: number
    hasUnsavedChanges: boolean
    onImportedOptions: (options: Record<string, unknown>) => void
}

const PluginSettingsImportExport: React.FC<PluginSettingsImportExportProps> = ({
    pluginId,
    mixerIndex,
    hasUnsavedChanges,
    onImportedOptions,
}) => {
    const importInputRef = React.useRef<HTMLInputElement>(null)
    const apiUrl = `/api/plugin-settings/${encodeURIComponent(pluginId)}/${mixerIndex}`

    const exportPluginSettings = () => {
        window.location.href = apiUrl
    }

    const importPluginSettings = async (
        event: React.ChangeEvent<HTMLInputElement>
    ) => {
        const file = event.target.files?.[0]
        event.target.value = ''
        if (!file) return

        try {
            const text = await file.text()
            const parsed = JSON.parse(text) as { options?: Record<string, unknown> }
            const response = await fetch(apiUrl, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ options: parsed.options ?? parsed }),
            })

            if (!response.ok) {
                const errorText = await response.text()
                window.alert(errorText || 'Failed to import plugin settings')
                return
            }

            const result = (await response.json()) as { options: Record<string, unknown> }
            onImportedOptions(result.options)
        } catch (_error) {
            window.alert('Failed to import plugin settings')
        }
    }

    return (
        <>
            <div className="settings-input-field">
                <button
                    className="settings-plugin-import-export-button"
                    type="button"
                    onClick={exportPluginSettings}
                    disabled={hasUnsavedChanges}
                    title={hasUnsavedChanges ? 'Save settings before exporting' : undefined}
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
