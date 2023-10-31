
# I18nTweeReplacer

---

this mod export addon:

`I18nTweeReplacer` : `I18nTweeReplacerAddon`

```json lines
{
  "addonPlugin": [
    {
      "modName": "I18nTweeReplacer",
      "addonName": "I18nTweeReplacerAddon",
      "modVersion": "^1.0.0",
      "params": {
        // 主搜索语言（备用替换语言），当当前语言找不到对应项或当前语言没有对应翻译时，使用此语言作为备用搜索
        "mainFindLanguage": "zh-CN",
        // 主替换语言（备用替换语言），当当前语言找不到对应项或当前语言没有对应翻译时，使用此语言作为备用替换
        "mainReplaceLanguage": "zh-CN",
        // 索引文件
        "replaceIndexFile": "to/file.json5",
        // 搜索文件（以语言列表的形式）
        "findLanguageFile": [
          {
            "language": "zh-CN",
            "file": "to/file.json5"
          },
          {
            "language": "en-US",
            "file": "to/file.json5"
          },
        ],
        // 替换文件（以语言列表的形式）
        "replaceLanguageFile": [
          {
            "language": "zh-CN",
            "file": "to/file.json5"
          },
          {
            "language": "en-US",
            "file": "to/file.json5"
          },
        ],
      }
    }
  ],
  "dependenceInfo": [
    {
      "modName": "I18nTweeReplacer",
      "version": "^1.0.0"
    }
  ]
}
```

`replaceIndexFile` 文件格式:

```json5
[
  {
    // 任意个字符串或数字，必须唯一
    id: "12345-67890-abcde-fghij",
    passage: "passageName",
    // debug 显示替换过程，此项可以不存在
    debug: true,
    // 替换全部，否则只替换第一个，此项可以不存在
    all: true,
  }
]
```

`findLanguageFile` 文件格式:

```json5
[
  {
    // 任意个字符串或数字，必须和replaceIndexFile中的id一一对应
    id: "12345-67890-abcde-fghij",
    // 以下 findString / findRegex 两个二选一，有且只能存在一个
    // 使用字符串精准匹配
    findString: "string",
    // 使用正则表达式匹配
    findRegex: "regexString",
    // 如果此项为 true ，则当前搜索项在当前语言下无效。（即当前语言不替换此项）
    noop: true,
  }
]
```

`replaceLanguageFile` 文件格式:

```json5
[
  {
    // 任意个字符串或数字，必须和replaceIndexFile中的id一一对应
    id: "12345-67890-abcde-fghij",
    // 以下 replace / replaceFile 两个二选一，有且只能存在一个
    // 使用字符串替换
    replace: "string",
    // 需要替换的字符串在此文件中
    replaceFile: "path/to/file.txt",
    // 如果此项为 true ，则当前搜索项在当前语言下无效。（即当前语言不替换此项）
    noop: true,
  }
]
```

---

数据组织结构

```

                 * ---> findItem[]
                /           ^
indexItem[] --*             |
                \           v
                 * ---> replaceItem[]

```



