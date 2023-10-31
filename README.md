
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
      "params": [
        {
          // which passage to replace
          "passage": "",
          // find string, string/regex
          "findString": "",
          "findRegex": "",
          // replace content, string/filePathInZip
          "replace": "",
          "replaceFile": "",
          // When setting debug to true, the replacement operation corresponding to this parameter will be output to the Console.
          "debug": true,
          // if you want to replace all, set this to true, otherwise only replace the first one.
          "all": true
        },
      ]
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
