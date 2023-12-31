
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
        // 主搜索语言（备用替换语言），当当前语言找不到对应项翻译文件时，使用此语言作为备用搜索
        "mainFindLanguage": "zh-CN",
        // 主替换语言（备用替换语言），当当前语言找不到对应翻译文件或当前语言没有对应翻译项时，使用此语言作为备用替换
        "mainReplaceLanguage": "zh-CN",
        // 索引文件
        //   对于主语言来说，索引文件中的每一个项都必须有对应的主语言Find文件和Replace项
        //   对于非主语言来说，如果没有对应的Replace翻译文件，则使用主语言的Replace翻译文件，如果没有对应的翻译项，则使用主语言Replace翻译文件中的翻译项进行替换；
        //   对于非主语言来说，如果没有对应的Find翻译文件，则使用主语言的Find翻译文件，如果没有对应的翻译项，则使用主语言Find翻译文件中的翻译项进行搜索。
        "replaceIndexFile": "to/file.json5",
        // 搜索文件（以语言列表的形式）
        // 其中的 language 项对应到 Navigator.language 的前缀
        //   参见：https://developer.mozilla.org/zh-CN/docs/Web/API/Navigator/language
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
    // 任意字符串或数字，必须唯一
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
    // 任意字符串或数字，必须和replaceIndexFile中的id一一对应
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
    // 任意字符串或数字，必须和replaceIndexFile中的id一一对应
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
                 /            |
                /             |
indexItem[] --*               |
                \             |
                 \            |
                  \           v
                    * ---> replaceItem[]


indexItem[N] - findItem[][N]
indexItem[N] - replaceItem[][N]

indexItem - findItem[N] - replaceItem[M]


```

---

## 转换工具 `ModFormatTranslator`

本项目提供一个转换工具，可以将 `TweeReplacer` 的格式转换为 `I18nTweeReplacer` 的格式

直接以如下格式调用即可


```shell
node <apth to ModFormatTraslator.js> <path to the boot.json that use TweeReplacer>
```


调用举例
```shell
node .\dist-tools\ModFormatTraslator.js h:\Code\DoL\DoLMod\fenghuang-mods\boot.json
```


