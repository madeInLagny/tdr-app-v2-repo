import gulp from "gulp";
import fileInclude from "gulp-file-include";
import i18n from "gulp-i18n-localize";
import path from "path";
import { readdirSync, statSync } from "fs";
import { deleteAsync } from "del";
import sitemap from "gulp-sitemap";
import fs from "fs"

const paths = {
  specificHtml: [
    /* 'src/TDR-Duty-Drawback-in-the-US.html', */
    "src/*.html",
  ],
  i18n: "src/i18n/en/**/",
  dist: "dist/tdr-app-v2-en",
  assets: {
    css: "src/css/**/*",
    js: "src/js/**/*",
    images: "src/images/**/*",
    eBook: "src/eBook/**/*",
  },
};

// Function to dynamically determine available locales
const getLocales = () => {
  const locales = readdirSync(path.join("src", "i18n")).filter((file) =>
    statSync(path.join("src", "i18n", file)).isDirectory()
  );
  return locales;
};

// Task to clean dist folder

const cleandist = () => {
  return deleteAsync([
    "dist/tdr-app-v2-en/*.html",
    "dist/tdr-app-v2-en/css",
    "dist/tdr-app-v2-en/js",
    "dist/tdr-app-v2-en/images",
    "dist/tdr-app-v2-en/eBook",
    // here we use a globbing pattern to match everything inside the `mobile` folder
    // we don't want to clean this file though so we negate the pattern
    /* "!dist/mobile/deploy.json", */
  ]);
};

// Task to process and localize the specific HTML files
export const buildSpecificHtml = () => {
  const locales = getLocales();
  return gulp
    .src(paths.specificHtml)
    .pipe(
      fileInclude({
        prefix: "@@",
        basepath: "@root", //@@include are relative to the path where gulp is running = rootpath
      })
    )
    .pipe(
      i18n({
        locales: locales,
        localeDir: path.join("src", "i18n"),
        schema: "",
      })
    )
    .pipe(gulp.dest("dist/"));
};

// Task to copy
export const copyCss = () => {
  return gulp
    .src(paths.assets.css)
    .pipe(gulp.dest(path.join(paths.dist, "css")));
};

export const copyJs = () => {
  return gulp.src(paths.assets.js).pipe(gulp.dest(path.join(paths.dist, "js")));
};

export const copyImages = () => {
  return gulp
    .src(paths.assets.images, { encoding: false })
    .pipe(gulp.dest(path.join(paths.dist, "images")));
};

export const copyEBook = () => {
  return gulp
    .src(paths.assets.eBook, { encoding: false })
    .pipe(gulp.dest(path.join(paths.dist, "eBook")));
};

// Task to watch changes for the specific files, blocks, and localization files
export const watchSpecificFiles = () => {
  gulp.watch(
    [
      ...paths.specificHtml,
      `${paths.blocks}**/*.html`,
      `${paths.i18n}**/*.json`,
    ],
    buildSpecificHtml
  );
  gulp.watch(paths.assets.css, copyCss);
  gulp.watch(paths.assets.js, copyJs);
  gulp.watch(paths.assets.images, copyImages);
};

// Task to create a site map from every html file in the src directory
export const createSiteMap = () => {
  return gulp
    .src(paths.specificHtml, {
      read: false,
    })
    .pipe(
      sitemap({
        siteUrl: "https://tradedutyrefund.com",
      })
    )
    .pipe(gulp.dest(paths.dist));
};

// Default task to build and watch all assets and files
export default gulp.series(
  cleandist,
  gulp.parallel(buildSpecificHtml, copyCss, copyJs, copyImages, copyEBook),
  createSiteMap,
  watchSpecificFiles
);
