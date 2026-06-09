const { withAppBuildGradle } = require("@expo/config-plugins");

function withAndroidLongPathsFix(config) {
  return withAppBuildGradle(config, (config) => {
    let contents = config.modResults.contents;

    // Check if we already have our fix to avoid duplicate insertions
    if (!contents.includes("CMAKE_OBJECT_PATH_MAX")) {
      // 1. Inject CMAKE_OBJECT_PATH_MAX into defaultConfig block
      const defaultConfigRegex = /(defaultConfig\s*\{)/;
      contents = contents.replace(defaultConfigRegex, `$1
        if (System.getProperty("os.name").toLowerCase().contains("windows")) {
            externalNativeBuild {
                cmake {
                    arguments "-DCMAKE_OBJECT_PATH_MAX=200"
                }
            }
        }`);

      // 2. Inject buildStagingDirectory after the androidResources block
      const androidResourcesRegex = /(androidResources\s*\{[^}]*\})/;
      contents = contents.replace(androidResourcesRegex, `$1\n\n    if (System.getProperty("os.name").toLowerCase().contains("windows")) {\n        externalNativeBuild {\n            cmake {\n                buildStagingDirectory "\${System.getProperty('user.home')}/.cx"\n            }\n        }\n    }`);
    } else {
      // If the fix is already there, update the values
      contents = contents.replace(/-DCMAKE_OBJECT_PATH_MAX=128/, "-DCMAKE_OBJECT_PATH_MAX=200");
      contents = contents.replace(/\.cxx-caresure/, ".cx");
    }

    config.modResults.contents = contents;
    return config;
  });
}

module.exports = withAndroidLongPathsFix;
