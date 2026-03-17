import {
    resolveChannelMatrixPreset,
    buildChannelMixerVolumes,
} from '../src/utils/mixerConnections/vmixChannelMatrix'

const LEFT = 1
const RIGHT = 2

describe('resolveChannelMatrixPreset', () => {
    // ─── Non-linkable channels ────────────────────────────────────────────────
    // Preset {N}L: input ch N → Left bus, all others → Right bus.
    // Both leftInput and rightInput are active (stereo, not mono).

    describe('non-linkable channel (stereo input, {N}L preset)', () => {
        it('activates both ch1 and ch2 and applies preset 1L', () => {
            expect(
                resolveChannelMatrixPreset({ leftInput: 1, rightInput: 2 })
            ).toEqual({ activeChannels: [1, 2], preset: '1L' })
        })

        it('activates ch3 and ch4 and applies preset 3L when wired to channels 3/4', () => {
            expect(
                resolveChannelMatrixPreset({ leftInput: 3, rightInput: 4 })
            ).toEqual({ activeChannels: [3, 4], preset: '3L' })
        })

        it('uses leftInput number in the preset name (not rightInput)', () => {
            expect(
                resolveChannelMatrixPreset({ leftInput: 5, rightInput: 6 })
            ).toEqual({ activeChannels: [5, 6], preset: '5L' })
        })
    })

    // ─── Linked stereo pair ───────────────────────────────────────────────────
    // Each vMix input in a linked pair is mono — only one channel is active.
    // Primary → leftInput only, Secondary → rightInput only.

    describe('linked stereo pair', () => {
        it('linked primary: activates only leftInput and applies L preset', () => {
            expect(
                resolveChannelMatrixPreset({
                    leftInput: LEFT,
                    rightInput: RIGHT,
                    linkedPreset: 'L',
                })
            ).toEqual({ activeChannels: [1], preset: 'L' })
        })

        it('linked secondary: activates only rightInput and applies R preset', () => {
            expect(
                resolveChannelMatrixPreset({
                    leftInput: LEFT,
                    rightInput: RIGHT,
                    linkedPreset: 'R',
                })
            ).toEqual({ activeChannels: [2], preset: 'R' })
        })

        it('primary and secondary each have exactly one different active channel', () => {
            const primary = resolveChannelMatrixPreset({
                leftInput: 3,
                rightInput: 4,
                linkedPreset: 'L',
            })
            const secondary = resolveChannelMatrixPreset({
                leftInput: 3,
                rightInput: 4,
                linkedPreset: 'R',
            })
            expect(primary.activeChannels).toEqual([3])
            expect(secondary.activeChannels).toEqual([4])
        })
    })

    // ─── Unlinked linkable pair ───────────────────────────────────────────────
    // Both halves of an unlinked pair are stereo; both channels active.
    // LR preset routes leftInput → Left bus, rightInput → Right bus.

    describe('unlinked linkable pair', () => {
        it('unlinked primary activates only leftInput — LR preset routes it to both buses', () => {
            expect(
                resolveChannelMatrixPreset({
                    leftInput: LEFT,
                    rightInput: RIGHT,
                    isLinkable: true,
                })
            ).toEqual({ activeChannels: [1], preset: 'LR' })
        })

        it('unlinked secondary activates only rightInput — LR preset routes it to both buses', () => {
            expect(
                resolveChannelMatrixPreset({
                    leftInput: LEFT,
                    rightInput: RIGHT,
                    isSecondary: true,
                })
            ).toEqual({ activeChannels: [2], preset: 'LR' })
        })

        it('isSecondary alone triggers LR preset and uses rightInput', () => {
            const result = resolveChannelMatrixPreset({
                leftInput: LEFT,
                rightInput: RIGHT,
                isSecondary: true,
                isLinkable: false,
            })
            expect(result.preset).toBe('LR')
            expect(result.activeChannels).toEqual([2])
        })

        it('custom lrPresetName is used instead of LR', () => {
            expect(
                resolveChannelMatrixPreset({
                    leftInput: LEFT,
                    rightInput: RIGHT,
                    isLinkable: true,
                    lrPresetName: 'StereoFull',
                })
            ).toEqual({ activeChannels: [1], preset: 'StereoFull' })
        })
    })

    // ─── Mix-minus (return feed) prefix ───────────────────────────────────────

    describe('mix-minus prefix', () => {
        it('linked primary with prefix: EXT1_L', () => {
            expect(
                resolveChannelMatrixPreset({
                    leftInput: LEFT,
                    rightInput: RIGHT,
                    linkedPreset: 'L',
                    prefix: 'EXT',
                    returnFeedNumber: 1,
                })
            ).toEqual({ activeChannels: [1], preset: 'EXT1_L' })
        })

        it('linked secondary with prefix: RTN2_R', () => {
            expect(
                resolveChannelMatrixPreset({
                    leftInput: LEFT,
                    rightInput: RIGHT,
                    linkedPreset: 'R',
                    prefix: 'RTN',
                    returnFeedNumber: 2,
                })
            ).toEqual({ activeChannels: [2], preset: 'RTN2_R' })
        })

        it('unlinked linkable with prefix: EXT1_LR', () => {
            expect(
                resolveChannelMatrixPreset({
                    leftInput: LEFT,
                    rightInput: RIGHT,
                    isLinkable: true,
                    prefix: 'EXT',
                    returnFeedNumber: 1,
                })
            ).toEqual({ activeChannels: [1], preset: 'EXT1_LR' })
        })

        it('non-linkable with prefix: EXT1_1L', () => {
            expect(
                resolveChannelMatrixPreset({
                    leftInput: 1,
                    rightInput: 2,
                    prefix: 'EXT',
                    returnFeedNumber: 1,
                })
            ).toEqual({ activeChannels: [1, 2], preset: 'EXT1_1L' })
        })

        it('prefix is ignored when returnFeedNumber is 0', () => {
            expect(
                resolveChannelMatrixPreset({
                    leftInput: LEFT,
                    rightInput: RIGHT,
                    linkedPreset: 'L',
                    prefix: 'EXT',
                    returnFeedNumber: 0,
                })
            ).toEqual({ activeChannels: [1], preset: 'L' })
        })

        it('prefix is ignored when prefix is undefined', () => {
            expect(
                resolveChannelMatrixPreset({
                    leftInput: LEFT,
                    rightInput: RIGHT,
                    linkedPreset: 'L',
                    prefix: undefined,
                    returnFeedNumber: 3,
                })
            ).toEqual({ activeChannels: [1], preset: 'L' })
        })

        it('custom lrPresetName is also prefixed for return feeds', () => {
            expect(
                resolveChannelMatrixPreset({
                    leftInput: LEFT,
                    rightInput: RIGHT,
                    isLinkable: true,
                    lrPresetName: 'StereoFull',
                    prefix: 'EXT',
                    returnFeedNumber: 3,
                })
            ).toEqual({ activeChannels: [1], preset: 'EXT3_StereoFull' })
        })
    })

    // ─── Preset loading default values ───────────────────────────────────────

    describe('preset loading (resetChannelMatrix pass)', () => {
        // During loadMixerPreset all inputs get leftInput=1, rightInput=2.

        it('non-linkable input: both channels active with 1L preset', () => {
            expect(
                resolveChannelMatrixPreset({ leftInput: 1, rightInput: 2 })
            ).toEqual({ activeChannels: [1, 2], preset: '1L' })
        })

        it('linked primary: only ch1 active with L preset', () => {
            expect(
                resolveChannelMatrixPreset({
                    leftInput: 1,
                    rightInput: 2,
                    linkedPreset: 'L',
                })
            ).toEqual({ activeChannels: [1], preset: 'L' })
        })

        it('linked secondary: only ch2 active with R preset (was the original bug: both went to ch1)', () => {
            expect(
                resolveChannelMatrixPreset({
                    leftInput: 1,
                    rightInput: 2,
                    linkedPreset: 'R',
                })
            ).toEqual({ activeChannels: [2], preset: 'R' })
        })
    })
})

describe('buildChannelMixerVolumes', () => {
    // ─── Single active channel (linked inputs — truly mono) ───────────────────

    describe('single active channel', () => {
        it('ch1 active: volumes[1]=100, all others 0', () => {
            const v = buildChannelMixerVolumes([1])
            expect(v[1]).toBe(100)
            for (let i = 2; i <= 8; i++) expect(v[i]).toBe(0)
        })

        it('ch2 active: volumes[2]=100, all others 0 (typical linked secondary)', () => {
            const v = buildChannelMixerVolumes([2])
            expect(v[2]).toBe(100)
            expect(v[1]).toBe(0)
            for (let i = 3; i <= 8; i++) expect(v[i]).toBe(0)
        })

        it('ch5 active: volumes[5]=100, all others 0', () => {
            const v = buildChannelMixerVolumes([5])
            for (let i = 1; i <= 8; i++) {
                expect(v[i]).toBe(i === 5 ? 100 : 0)
            }
        })
    })

    // ─── Two active channels (unlinked stereo inputs) ─────────────────────────

    describe('two active channels', () => {
        it('ch1 and ch2 active: volumes[1]=100, volumes[2]=100, rest 0', () => {
            const v = buildChannelMixerVolumes([1, 2])
            expect(v[1]).toBe(100)
            expect(v[2]).toBe(100)
            for (let i = 3; i <= 8; i++) expect(v[i]).toBe(0)
        })

        it('ch3 and ch4 active: correct for a pair wired to channels 3/4', () => {
            const v = buildChannelMixerVolumes([3, 4])
            expect(v[3]).toBe(100)
            expect(v[4]).toBe(100)
            expect(v[1]).toBe(0)
            expect(v[2]).toBe(0)
        })
    })

    // ─── General invariants ───────────────────────────────────────────────────

    describe('general invariants', () => {
        it('always produces exactly 8 entries by default', () => {
            expect(Object.keys(buildChannelMixerVolumes([1])).length).toBe(8)
            expect(Object.keys(buildChannelMixerVolumes([1, 2])).length).toBe(8)
        })

        it('respects a custom totalChannels value', () => {
            const v = buildChannelMixerVolumes([2], 4)
            expect(Object.keys(v)).toEqual(['1', '2', '3', '4'])
            expect(v[2]).toBe(100)
            expect(v[1]).toBe(0)
        })

        it('no channel has a value other than 0 or 100', () => {
            for (const activeChannels of [[1], [2], [1, 2], [3, 4]]) {
                Object.values(buildChannelMixerVolumes(activeChannels)).forEach(
                    (v) => {
                        expect([0, 100]).toContain(v)
                    }
                )
            }
        })

        it('round-trips: every activeChannel from resolveChannelMatrixPreset gets 100', () => {
            const cases = [
                { leftInput: 1, rightInput: 2 }, // non-linkable → [1,2]
                { leftInput: 1, rightInput: 2, linkedPreset: 'L' as const }, // linked primary → [1]
                { leftInput: 1, rightInput: 2, linkedPreset: 'R' as const }, // linked secondary → [2]
                { leftInput: 1, rightInput: 2, isLinkable: true }, // unlinked primary → [1]
                { leftInput: 1, rightInput: 2, isSecondary: true }, // unlinked secondary → [2]
                { leftInput: 3, rightInput: 4, linkedPreset: 'R' as const }, // linked secondary on ch4 → [4]
            ]
            for (const args of cases) {
                const { activeChannels } = resolveChannelMatrixPreset(args)
                const volumes = buildChannelMixerVolumes(activeChannels)
                for (const ch of activeChannels) {
                    expect(volumes[ch]).toBe(100)
                }
            }
        })
    })
})
