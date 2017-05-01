'use strict';

module.exports = function replacer(template, variables) {
    if (!template) {
        return '';
    }
    if (typeof template !== 'string') {
        template = template.toString();
    }
    for (let i = 0; i < variables.length; i++) {
        template = template.replace('$' + (i + 1), variables[i]);
    }
    return template;
};