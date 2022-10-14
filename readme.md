# NGL Wrapper
Специализированная обертка для https://psskb.org

Живая демонстрация: https://protdb.github.io/NGLWrapper/examples.html

## Использование

В целом в соответствии примерами в example.html

В шапке подключаются два скрипта:

```html
<script src="ngl.js"></script>
<script src="ngl_wrapper.js"></script>
```

В качестве входных параметров требуется создать контейнер, содержащий три элемента:
- stage: пространство для отображения структуры, должно иметь заданный размер и класс `ngl_stage`
- controls: блок, в который будут добавлены кнопки. Класс `ngl_controls`
- loader: загрузчик. Крутится, пока структура не будет полностью загружена и готова к отображению. С помощью CSS должен быть спозиционирован поверх stage. После загрузки Wrapper сам установит ему значение стиля display: none. Класс `ngl-loader`

```html
<div id="ngl_wrapper_structure">
    <div class="ngl_stage" style="width: 600px; height: 600px"></div>
    <div class="ngl_controls"></div>
    <div class="ngl_loader"></div>
</div>
```

Wrapper инициализируется следующим функцией:

```javascript
structure_wrapper = await initiateWrapper(
            container_elem,
            params,
            controls_translations)
```
Где:
- container_elem - элемент DOM контейнера (полученный, напр., с помощью `document.getElementById`)
- params - JSON с параметрами, сформированный на сайте или полученный из Data API. Формат описан в Swagger'е Data API и соотв. задачах, где он нужен.
- control_translations - список переводов названий кнопок, генерируемых скриптом. Список должен быть представлен в виде JS-объекта, где Id кнопок - это ключи, а читаемые названия в текущей локализации - значения, т.е. напр:

```json
{
    "ngl_focus_all_button": "Фокус на белок",
    "ngl_focus_chain_button": "Фокус на цепь",
    "ngl_focus_fragment_button": "Фокус на фрагмент",
    "ngl_show_all_button": "Показать весь белок",
    "ngl_show_chain_button": "Показать всю цепь",
    "ngl_show_fragment_button": "Показать только фрагмент"
}
```

Примечание: список выше примерный и неполный, хардкодить не надо. Если Wrapper должен отрисовать кнопку, для которой не передана локализация, то он отобразит вместо названия ID кнопки (как на примерах 3,4 в examples.html)

Возвращается объект wrapper, который требуется в дальнейшем использовать для применения картирования.

## Картирование

Для выделения произвольного фрагмента белка (например, позиции найденной поиском FASTA) требуется использовать метод wrapper'а `drawCustomSelection`

```javascript
wrapper.drawCustomSelection(
    chain,
    start,
    end
)
```
В неё передаются параметры:
- chain: ID цепи для выделения
- start: номер аминокислоты начала последоватлеьности
- end: номер аминокислоты конца последовательности

Примечание: есть несколько доп. параметров, но сейчас они не используются

Чтобы сбросить выделение, используется метод `wrapper.cleanCustomSelection()`