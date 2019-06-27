import { ICasparCGMixerGeometry, ICasparCGMixerGeometryFile } from '../MixerProtocolPresets';
import * as fs from 'fs';
import * as os from 'os';
import * as path from 'path';

const CONFIG_FILE_NAME = 'sisyfos-casparcg-geometry.json';
const geometryFile = path.join(os.homedir(), CONFIG_FILE_NAME);

let geometry: ICasparCGMixerGeometryFile | undefined = undefined

try {
	let inputObj = JSON.parse(fs.readFileSync(geometryFile, {
		encoding: 'utf-8'
	}))
	if (inputObj.toMixer && inputObj.toMixer.PGM_CHANNEL_FADER_LEVEL) {
		geometry = inputObj
	}
} catch (e) {
	console.error('Could not open CasparCG Audio geometry file', e)
}

let CasparCGMasterObject: ICasparCGMixerGeometry | undefined = undefined

if (geometry) {
	CasparCGMasterObject = {
		protocol: 'CasparCG',
		label: `CasparCG Audio Mixer (${geometry.label})`,
		mode: "master", //master (ignores mixers faderlevel, and use faderlevel as gain preset),
		studio: "rk10",
		leadingZeros: false,
		pingTime: 0,
		fromMixer: geometry.fromMixer,
		toMixer: geometry.toMixer,
		fader: {
			min: 0,
			max: 1.5,
			zero: 1,
			step: 0.001,
		},
		meter: {
			min: 0,
			max: 1,
			zero: 0.75,
			test: 0.6,
		},
		channelLabels: geometry.channelLabels,
        sourceOptions: geometry.sourceOptions,
        //CHANNELTYES ARE NOT IMPLEMENTED.
        //THIS IS JUST TO AVOID ERRORS AS
        //channelTypes are moved to IMixerProtocolGeneric
        channelTypes: [{
            channelTypeName: 'Channels',
            channelTypeColor: '#2f2f2f',
            fromMixer: {
                CHANNEL_FADER_LEVEL: ['none'],
                CHANNEL_OUT_GAIN: ['none'],
                CHANNEL_VU: ['none'],
                CHANNEL_NAME: 'none',
                PFL: ['todo'],
                AUX_SEND: ['none'],
            },
            toMixer: {
                CHANNEL_FADER_LEVEL: ['none'],
                CHANNEL_OUT_GAIN: ['none'],
                PFL_ON: [{
                    mixerMessage: "none",
                    value: 1,
                    type: "i"
                }],
                PFL_OFF: [{
                    mixerMessage: "none",
                    value: 0,
                    type: "i"
                }],
                AUX_SEND: ['none'],
            },
        }]
	}
}

export const CasparCGMaster = CasparCGMasterObject
