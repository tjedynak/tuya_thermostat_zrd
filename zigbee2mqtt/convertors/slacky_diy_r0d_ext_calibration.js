// External converter for THERM_SLACKY_DIY_R0D (Moes Star Ring, _TZE204_lpedvtvr)
// with firmware 1.0.24 or newer.
//
// It reuses the built-in definition from zigbee-herdsman-converters and adds
// external_temperature_calibration (attribute 0xF00C, int8, 0.1°C): a software
// offset of the floor sensor applied by the Zigbee module. Remove this file once
// the built-in definition exposes it for R0D.
//
// After adding it to data/external_converters, restart Zigbee2MQTT and run
// "Reconfigure" on the device, so reporting of 0xF00C is set up.

const {definitions} = require('zigbee-herdsman-converters/devices/slacky_diy');
const exposes = require('zigbee-herdsman-converters/lib/exposes');
const utils = require('zigbee-herdsman-converters/lib/utils');

const e = exposes.presets;
const ea = exposes.access;

const attrThermExtTemperatureCalibration = 0xf00c;
const calibrationMin = -10;
const calibrationMax = 10;

const base = definitions.find((d) => d.model === 'THERM_SLACKY_DIY_R0D');
if (!base) {
    throw new Error('THERM_SLACKY_DIY_R0D not found in zigbee-herdsman-converters');
}

// Unlike the R08/R09 converter (whole degrees, MCU side), the R0D offset is
// handled by the module in 0.1°C, so the value is not rounded to an integer.
const tzExtTemperatureCalibration = {
    key: ['external_temperature_calibration'],
    convertSet: async (entity, key, value, meta) => {
        utils.assertNumber(value);
        const clamped = Math.min(calibrationMax, Math.max(calibrationMin, value));
        const raw = Math.round(clamped * 10);
        await entity.write('hvacThermostat', {[attrThermExtTemperatureCalibration]: {value: raw, type: 0x28}});
        return {readAfterWriteTime: 250, state: {external_temperature_calibration: raw / 10}};
    },
    convertGet: async (entity, key, meta) => {
        await entity.read('hvacThermostat', [attrThermExtTemperatureCalibration]);
    },
};

const definition = {
    ...base,
    description: `${base.description} (floor sensor calibration)`,
    toZigbee: [
        tzExtTemperatureCalibration,
        ...base.toZigbee.filter((c) => !c.key || !c.key.includes('external_temperature_calibration')),
    ],
    exposes: [
        ...base.exposes,
        e
            .numeric('external_temperature_calibration', ea.ALL)
            .withUnit('°C')
            .withValueMin(calibrationMin)
            .withValueMax(calibrationMax)
            .withValueStep(0.5)
            .withDescription(
                'Floor (outer) sensor calibration, added to the value from the MCU. ' +
                    'The MCU already applies local_temperature_calibration to the floor sensor as well',
            ),
    ],
    configure: async (device, coordinatorEndpoint, def) => {
        await base.configure(device, coordinatorEndpoint, def);
        const endpoint = device.getEndpoint(1);
        await endpoint.configureReporting('hvacThermostat', [
            {
                attribute: {ID: attrThermExtTemperatureCalibration, type: 0x28},
                minimumReportInterval: 0,
                maximumReportInterval: 3600,
                reportableChange: 0,
            },
        ]);
    },
};

module.exports = definition;
