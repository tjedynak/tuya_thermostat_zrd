## Краткое описание термостата с сигнатурой

	"_TZE204_lpedvtvr"
	
### Внешний вид.

<img src="../../images/model0d.png"/>

### Настройки, доступные удаленно.

<img src="../../images/thermostat_r0d_exposes.jpg"/>

### Калибровка внешнего датчика.

MCU термостата применяет `local_temperature_calibration` (DP `0x65`) сразу к обоим датчикам - внутреннему и внешнему (напольному). Отдельной калибровки внешнего датчика в MCU нет, поэтому начиная с версии 1.0.24 она выполняется в модуле Zigbee (атрибут `0xF00C`, `external_temperature_calibration`, -10...+10 °C):

	outdoor_temperature = значение от MCU + external_temperature_calibration

Пример: `local_temperature_calibration` = -6 °C занижает и пол на 6 °C, `external_temperature_calibration` = +6 °C возвращает полу исходное значение. После изменения `local_temperature_calibration` нужно поправить и `external_temperature_calibration`.

Поправка влияет только на отображаемую температуру пола. MCU по-прежнему регулирует и срабатывает по `heat_protect` по своему значению (с учётом `local_temperature_calibration`).

The thermostat MCU applies `local_temperature_calibration` (DP `0x65`) to both the inner and the outer (floor) sensor and has no separate calibration for the outer one. Since 1.0.24 the module adds `external_temperature_calibration` (attribute `0xF00C`, -10...+10 °C) to the floor value reported by the MCU. It changes only the reported floor temperature: regulation and `heat_protect` in the MCU still use the MCU's own value.

### Расписание.

Расписание имеет 7 вхождений по 4 периода.

	1. Понельник.
	2. Вторник.
	3. Среда.
	4. Четверг.
	5. Пятница.
	6. Суббота.
	7. Воскресенье.

Один период - часы, минуты и температура включения.
