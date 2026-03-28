function getFieldInfo(name) {
    const $label = $(`label:contains("${name}")`);
    return $label.find('sup').attr('data-tooltip-info')
}

getFieldInfo('类别代码');