// Copyright 2006 The Closure Library Authors. All Rights Reserved.
//
// Licensed under the Apache License, Version 2.0 (the "License");
// you may not use this file except in compliance with the License.
// You may obtain a copy of the License at
//
//      http://www.apache.org/licenses/LICENSE-2.0
//
// Unless required by applicable law or agreed to in writing, software
// distributed under the License is distributed on an "AS-IS" BASIS,
// WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
// See the License for the specific language governing permissions and
// limitations under the License.

/**
 * @fileoverview Bootstrap for the Google JS Library (Closure).
 *
 * In uncompiled mode base.js will write out Closure's deps file, unless the
 * global <code>CLOSURE_NO_DEPS</code> is set to true.  This allows projects to
 * include their own deps file(s) from different locations.
 *
 * @author arv@google.com (Erik Arvidsson)
 *
 * @provideGoog
 */


/**
 * @define {boolean} Overridden to true by the compiler when --closure_pass
 *     or --mark_as_compiled is specified.
 */
var COMPILED = false;


/**
 * Base namespace for the Closure library.  Checks to see goog is already
 * defined in the current scope before assigning to prevent clobbering if
 * base.js is loaded more than once.
 *
 * @const
 */
var goog = goog || {};


/**
 * Reference to the global context.  In most cases this will be 'window'.
 */
goog.global = this;


/**
 * A hook for overriding the define values in uncompiled mode.
 *
 * In uncompiled mode, {@code CLOSURE_UNCOMPILED_DEFINES} may be defined before
 * loading base.js.  If a key is defined in {@code CLOSURE_UNCOMPILED_DEFINES},
 * {@code goog.define} will use the value instead of the default value.  This
 * allows flags to be overwritten without compilation (this is normally
 * accomplished with the compiler's "define" flag).
 *
 * Example:
 * <pre>
 *   var CLOSURE_UNCOMPILED_DEFINES = {'goog.DEBUG': false};
 * </pre>
 *
 * @type {Object.<string, (string|number|boolean)>|undefined}
 */
goog.global.CLOSURE_UNCOMPILED_DEFINES;


/**
 * A hook for overriding the define values in uncompiled or compiled mode,
 * like CLOSURE_UNCOMPILED_DEFINES but effective in compiled code.  In
 * uncompiled code CLOSURE_UNCOMPILED_DEFINES takes precedence.
 *
 * Also unlike CLOSURE_UNCOMPILED_DEFINES the values must be number, boolean or
 * string literals or the compiler will emit an error.
 *
 * While any @define value may be set, only those set with goog.define will be
 * effective for uncompiled code.
 *
 * Example:
 * <pre>
 *   var CLOSURE_DEFINES = {'goog.DEBUG': false};
 * </pre>
 *
 * @type {Object.<string, (string|number|boolean)>|undefined}
 */
goog.global.CLOSURE_DEFINES;


/**
 * Returns true if the specified value is not undefined.
 * WARNING: Do not use this to test if an object has a property. Use the in
 * operator instead.
 *
 * @param {?} val Variable to test.
 * @return {boolean} Whether variable is defined.
 */
goog.isDef = function(val) {
  // void 0 always evaluates to undefined and hence we do not need to depend on
  // the definition of the global variable named 'undefined'.
  return val !== void 0;
};


/**
 * Builds an object structure for the provided namespace path, ensuring that
 * names that already exist are not overwritten. For example:
 * "a.b.c" -> a = {};a.b={};a.b.c={};
 * Used by goog.provide and goog.exportSymbol.
 * @param {string} name name of the object that this file defines.
 * @param {*=} opt_object the object to expose at the end of the path.
 * @param {Object=} opt_objectToExportTo The object to add the path to; default
 *     is |goog.global|.
 * @private
 */
goog.exportPath_ = function(name, opt_object, opt_objectToExportTo) {
  var parts = name.split('.');
  var cur = opt_objectToExportTo || goog.global;

  // Internet Explorer exhibits strange behavior when throwing errors from
  // methods externed in this manner.  See the testExportSymbolExceptions in
  // base_test.html for an example.
  if (!(parts[0] in cur) && cur.execScript) {
    cur.execScript('var ' + parts[0]);
  }

  // Certain browsers cannot parse code in the form for((a in b); c;);
  // This pattern is produced by the JSCompiler when it collapses the
  // statement above into the conditional loop below. To prevent this from
  // happening, use a for-loop and reserve the init logic as below.

  // Parentheses added to eliminate strict JS warning in Firefox.
  for (var part; parts.length && (part = parts.shift());) {
    if (!parts.length && goog.isDef(opt_object)) {
      // last part and we have an object; use it
      cur[part] = opt_object;
    } else if (cur[part]) {
      cur = cur[part];
    } else {
      cur = cur[part] = {};
    }
  }
};


/**
 * Defines a named value. In uncompiled mode, the value is retreived from
 * CLOSURE_DEFINES or CLOSURE_UNCOMPILED_DEFINES if the object is defined and
 * has the property specified, and otherwise used the defined defaultValue.
 * When compiled the default can be overridden using the compiler
 * options or the value set in the CLOSURE_DEFINES object.
 *
 * @param {string} name The distinguished name to provide.
 * @param {string|number|boolean} defaultValue
 */
goog.define = function(name, defaultValue) {
  var value = defaultValue;
  if (!COMPILED) {
    if (goog.global.CLOSURE_UNCOMPILED_DEFINES &&
        Object.prototype.hasOwnProperty.call(
            goog.global.CLOSURE_UNCOMPILED_DEFINES, name)) {
      value = goog.global.CLOSURE_UNCOMPILED_DEFINES[name];
    } else if (goog.global.CLOSURE_DEFINES &&
        Object.prototype.hasOwnProperty.call(
            goog.global.CLOSURE_DEFINES, name)) {
      value = goog.global.CLOSURE_DEFINES[name];
    }
  }
  goog.exportPath_(name, value);
};


/**
 * @define {boolean} DEBUG is provided as a convenience so that debugging code
 * that should not be included in a production js_binary can be easily stripped
 * by specifying --define goog.DEBUG=false to the JSCompiler. For example, most
 * toString() methods should be declared inside an "if (goog.DEBUG)" conditional
 * because they are generally used for debugging purposes and it is difficult
 * for the JSCompiler to statically determine whether they are used.
 */
goog.DEBUG = true;


/**
 * @define {string} LOCALE defines the locale being used for compilation. It is
 * used to select locale specific data to be compiled in js binary. BUILD rule
 * can specify this value by "--define goog.LOCALE=<locale_name>" as JSCompiler
 * option.
 *
 * Take into account that the locale code format is important. You should use
 * the canonical Unicode format with hyphen as a delimiter. Language must be
 * lowercase, Language Script - Capitalized, Region - UPPERCASE.
 * There are few examples: pt-BR, en, en-US, sr-Latin-BO, zh-Hans-CN.
 *
 * See more info about locale codes here:
 * http://www.unicode.org/reports/tr35/#Unicode_Language_and_Locale_Identifiers
 *
 * For language codes you should use values defined by ISO 693-1. See it here
 * http://www.w3.org/WAI/ER/IG/ert/iso639.htm. There is only one exception from
 * this rule: the Hebrew language. For legacy reasons the old code (iw) should
 * be used instead of the new code (he), see http://wiki/Main/IIISynonyms.
 */
goog.define('goog.LOCALE', 'en');  // default to en


/**
 * @define {boolean} Whether this code is running on trusted sites.
 *
 * On untrusted sites, several native functions can be defined or overridden by
 * external libraries like Prototype, Datejs, and JQuery and setting this flag
 * to false forces closure to use its own implementations when possible.
 *
 * If your JavaScript can be loaded by a third party site and you are wary about
 * relying on non-standard implementations, specify
 * "--define goog.TRUSTED_SITE=false" to the JSCompiler.
 */
goog.define('goog.TRUSTED_SITE', true);


/**
 * @define {boolean} Whether a project is expected to be running in strict mode.
 *
 * This define can be used to trigger alternate implementations compatible with
 * running in EcmaScript Strict mode or warn about unavailable functionality.
 * See https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Functions_and_function_scope/Strict_mode
 */
goog.define('goog.STRICT_MODE_COMPATIBLE', false);


/**
 * Creates object stubs for a namespace.  The presence of one or more
 * goog.provide() calls indicate that the file defines the given
 * objects/namespaces.  Provided objects must not be null or undefined.
 * Build tools also scan for provide/require statements
 * to discern dependencies, build dependency files (see deps.js), etc.
 * @see goog.require
 * @param {string} name Namespace provided by this file in the form
 *     "goog.package.part".
 */
goog.provide = function(name) {
  if (!COMPILED) {
    // Ensure that the same namespace isn't provided twice.
    // A goog.module/goog.provide maps a goog.require to a specific file
    if (goog.isProvided_(name)) {
      throw Error('Namespace "' + name + '" already declared.');
    }
  }

  goog.constructNamespace_(name);
};


/**
 * @param {string} name Namespace provided by this file in the form
 *     "goog.package.part".
 * @param {Object=} opt_obj The object to embed in the namespace.
 */
goog.constructNamespace_ = function(name, opt_obj) {
  if (!COMPILED) {
    delete goog.implicitNamespaces_[name];

    var namespace = name;
    while ((namespace = namespace.substring(0, namespace.lastIndexOf('.')))) {
      if (goog.getObjectByName(namespace)) {
        break;
      }
      goog.implicitNamespaces_[namespace] = true;
    }
  }

  goog.exportPath_(name, opt_obj);
};


/**
 * goog.module serves two purposes:
 * - marks a file that must be loaded as a module
 * - reserves a namespace (it can not also be goog.provided)
 * and has three requirements:
 * - goog.module may not be used in the same file as goog.provide.
 * - goog.module must be the first statement in the file.
 * - only one goog.module is allowed per file.
 * When a goog.module annotated file is loaded, it is loaded enclosed in
 * a strict function closure. This means that:
 * - any variable declared in a goog.module file are private to the file,
 * not global. Although the compiler is expected to inline the module.
 * - The code must obey all the rules of "strict" JavaScript.
 * - the file will be marked as "use strict"
 *
 * NOTE: unlike goog.provide, goog.module does not declare any symbols by
 * itself.
 *
 * @param {string} name Namespace provided by this file in the form
 *     "goog.package.part", is expected but not required.
 */
goog.module = function(name) {
  if (!goog.isString(name) || !name) {
    throw Error('Invalid module identifier');
  }
  if (!goog.isInModuleLoader_()) {
    throw Error('Module ' + name + ' has been loaded incorrectly.');
  }
  if (goog.moduleLoaderState_.moduleName) {
    throw Error('goog.module may only be called once per module.');
  }

  // Store the module name for the loader.
  goog.moduleLoaderState_.moduleName = name;
  if (!COMPILED) {
    // Ensure that the same namespace isn't provided twice.
    // A goog.module/goog.provide maps a goog.require to a specific file
    if (goog.isProvided_(name)) {
      throw Error('Namespace "' + name + '" already declared.');
    }
    delete goog.implicitNamespaces_[name];
  }
};


/**
 * @param {string} name The module identifier.
 * @return {?} The module exports for an already loaded module or null.
 *
 * Note: This is not an alternative to goog.require, it does not
 * indicate a hard dependency, instead it is used to indicate
 * an optional dependency or to access the exports of a module
 * that has already been loaded.
 */
goog.module.get = function(name) {
  return goog.module.getInternal_(name);
};


/**
 * @param {string} name The module identifier.
 * @return {?} The module exports for an already loaded module or null.
 * @private
 */
goog.module.getInternal_ = function(name) {
  if (!COMPILED) {
    if (goog.isProvided_(name)) {
      // goog.require only return a value with-in goog.module files.
      return name in goog.loadedModules_ ?
          goog.loadedModules_[name] :
          goog.getObjectByName(name);
    } else {
      return null;
    }
  }
};


/**
 * @private {{
 *     moduleName:(string|undefined),
 *     declareTestMethods:boolean}|null}}
 */
goog.moduleLoaderState_ = null;


/**
 * @private
 * @return {boolean} Whether a goog.module is currently being initialized.
 */
goog.isInModuleLoader_ = function() {
  return goog.moduleLoaderState_ != null;
};


/**
 * Indicate that a module's exports that are known test methods should
 * be copied to the global object.  This makes the test methods visible to
 * test runners that inspect the global object.
 *
 * TODO(johnlenz): Make the test framework aware of goog.module so
 * that this isn't necessary. Alternately combine this with goog.setTestOnly
 * to minimize boiler plate.
 */
goog.module.declareTestMethods = function() {
  if (!goog.isInModuleLoader_()) {
    throw new Error('goog.module.declareTestMethods must be called from ' +
        'within a goog.module');
  }
  goog.moduleLoaderState_.declareTestMethods = true;
};


/**
 * Indicate that a module's exports that are known test methods should
 * be copied to the global object.  This makes the test methods visible to
 * test runners that inspect the global object.
 *
 * TODO(johnlenz): Make the test framework aware of goog.module so
 * that this isn't necessary. Alternately combine this with goog.setTestOnly
 * to minimize boiler plate.
 */
goog.module.declareLegacyNamespace = function() {
  if (!COMPILED && !goog.isInModuleLoader_()) {
    throw new Error('goog.module.declareLegacyNamespace must be called from ' +
        'within a goog.module');
  }
  if (!COMPILED && !goog.moduleLoaderState_.moduleName) {
    throw Error('goog.module must be called prior to ' + 
        'goog.module.declareLegacyNamespace.');
  }
  goog.moduleLoaderState_.declareLegacyNamespace = true;
}


/**
 * Marks that the current file should only be used for testing, and never for
 * live code in production.
 *
 * In the case of unit tests, the message may optionally be an exact namespace
 * for the test (e.g. 'goog.stringTest'). The linter will then ignore the extra
 * provide (if not explicitly defined in the code).
 *
 * @param {string=} opt_message Optional message to add to the error that's
 *     raised when used in production code.
 */
goog.setTestOnly = function(opt_message) {
  if (COMPILED && !goog.DEBUG) {
    opt_message = opt_message || '';
    throw Error('Importing test-only code into non-debug environment' +
                (opt_message ? ': ' + opt_message : '.'));
  }
};


/**
 * Forward declares a symbol. This is an indication to the compiler that the
 * symbol may be used in the source yet is not required and may not be provided
 * in compilation.
 *
 * The most common usage of forward declaration is code that takes a type as a
 * function parameter but does not need to require it. By forward declaring
 * instead of requiring, no hard dependency is made, and (if not required
 * elsewhere) the namespace may never be required and thus, not be pulled
 * into the JavaScript binary. If it is required elsewhere, it will be type
 * checked as normal.
 *
 *
 * @param {string} name The namespace to forward declare in the form of
 *     "goog.package.part".
 */
goog.forwardDeclare = function(name) {};


if (!COMPILED) {

  /**
   * Check if the given name has been goog.provided. This will return false for
   * names that are available only as implicit namespaces.
   * @param {string} name name of the object to look for.
   * @return {boolean} Whether the name has been provided.
   * @private
   */
  goog.isProvided_ = function(name) {
    return (name in goog.loadedModules_) ||
        (!goog.implicitNamespaces_[name] &&
            goog.isDefAndNotNull(goog.getObjectByName(name)));
  };

  /**
   * Namespaces implicitly defined by goog.provide. For example,
   * goog.provide('goog.events.Event') implicitly declares that 'goog' and
   * 'goog.events' must be namespaces.
   *
   * @type {Object.<string, (boolean|undefined)>}
   * @private
   */
  goog.implicitNamespaces_ = {'goog.module': true};

  // NOTE: We add goog.module as an implicit namespace as goog.module is defined
  // here and because the existing module package has not been moved yet out of
  // the goog.module namespace. This satisifies both the debug loader and
  // ahead-of-time dependency management.
}


/**
 * Returns an object based on its fully qualified external name.  The object
 * is not found if null or undefined.  If you are using a compilation pass that
 * renames property names beware that using this function will not find renamed
 * properties.
 *
 * @param {string} name The fully qualified name.
 * @param {Object=} opt_obj The object within which to look; default is
 *     |goog.global|.
 * @return {?} The value (object or primitive) or, if not found, null.
 */
goog.getObjectByName = function(name, opt_obj) {
  var parts = name.split('.');
  var cur = opt_obj || goog.global;
  for (var part; part = parts.shift(); ) {
    if (goog.isDefAndNotNull(cur[part])) {
      cur = cur[part];
    } else {
      return null;
    }
  }
  return cur;
};


/**
 * Globalizes a whole namespace, such as goog or goog.lang.
 *
 * @param {Object} obj The namespace to globalize.
 * @param {Object=} opt_global The object to add the properties to.
 * @deprecated Properties may be explicitly exported to the global scope, but
 *     this should no longer be done in bulk.
 */
goog.globalize = function(obj, opt_global) {
  var global = opt_global || goog.global;
  for (var x in obj) {
    global[x] = obj[x];
  }
};


/**
 * Adds a dependency from a file to the files it requires.
 * @param {string} relPath The path to the js file.
 * @param {Array.<string>} provides An array of strings with
 *     the names of the objects this file provides.
 * @param {Array.<string>} requires An array of strings with
 *     the names of the objects this file requires.
 * @param {boolean=} opt_isModule Whether this dependency must be loaded as
 *     a module as declared by goog.module.
 */
goog.addDependency = function(relPath, provides, requires, opt_isModule) {
  if (goog.DEPENDENCIES_ENABLED) {
    var provide, require;
    var path = relPath.replace(/\\/g, '/');
    var deps = goog.dependencies_;
    for (var i = 0; provide = provides[i]; i++) {
      deps.nameToPath[provide] = path;
      deps.pathIsModule[path] = !!opt_isModule;
    }
    for (var j = 0; require = requires[j]; j++) {
      if (!(path in deps.requires)) {
        deps.requires[path] = {};
      }
      deps.requires[path][require] = true;
    }
  }
};




// NOTE(nnaze): The debug DOM loader was included in base.js as an original way
// to do "debug-mode" development.  The dependency system can sometimes be
// confusing, as can the debug DOM loader's asynchronous nature.
//
// With the DOM loader, a call to goog.require() is not blocking -- the script
// will not load until some point after the current script.  If a namespace is
// needed at runtime, it needs to be defined in a previous script, or loaded via
// require() with its registered dependencies.
// User-defined namespaces may need their own deps file.  See http://go/js_deps,
// http://go/genjsdeps, or, externally, DepsWriter.
// https://developers.google.com/closure/library/docs/depswriter
//
// Because of legacy clients, the DOM loader can't be easily removed from
// base.js.  Work is being done to make it disableable or replaceable for
// different environments (DOM-less JavaScript interpreters like Rhino or V8,
// for example). See bootstrap/ for more information.


/**
 * @define {boolean} Whether to enable the debug loader.
 *
 * If enabled, a call to goog.require() will attempt to load the namespace by
 * appending a script tag to the DOM (if the namespace has been registered).
 *
 * If disabled, goog.require() will simply assert that the namespace has been
 * provided (and depend on the fact that some outside tool correctly ordered
 * the script).
 */
goog.define('goog.ENABLE_DEBUG_LOADER', true);


/**
 * @param {string} msg
 * @private
 */
goog.logToConsole_ = function(msg) {
  if (goog.global.console) {
    goog.global.console['error'](msg);
  }
};


/**
 * Implements a system for the dynamic resolution of dependencies that works in
 * parallel with the BUILD system. Note that all calls to goog.require will be
 * stripped by the JSCompiler when the --closure_pass option is used.
 * @see goog.provide
 * @param {string} name Namespace to include (as was given in goog.provide()) in
 *     the form "goog.package.part".
 * @return {?} If called within a goog.module file, the associated namespace or
 *     module otherwise null.
 */
goog.require = function(name) {

  // If the object already exists we do not need do do anything.
  if (!COMPILED) {
    if (goog.isProvided_(name)) {
      if (goog.isInModuleLoader_()) {
        return goog.module.getInternal_(name);
      } else {
        return null;
      }
    }

    if (goog.ENABLE_DEBUG_LOADER) {
      var path = goog.getPathFromDeps_(name);
      if (path) {
        goog.included_[path] = true;
        goog.writeScripts_();
        return null;
      }
    }

    var errorMessage = 'goog.require could not find: ' + name;
    goog.logToConsole_(errorMessage);

    throw Error(errorMessage);
  }
};


/**
 * Path for included scripts.
 * @type {string}
 */
goog.basePath = '';


/**
 * A hook for overriding the base path.
 * @type {string|undefined}
 */
goog.global.CLOSURE_BASE_PATH;


/**
 * Whether to write out Closure's deps file. By default, the deps are written.
 * @type {boolean|undefined}
 */
goog.global.CLOSURE_NO_DEPS;


/**
 * A function to import a single script. This is meant to be overridden when
 * Closure is being run in non-HTML contexts, such as web workers. It's defined
 * in the global scope so that it can be set before base.js is loaded, which
 * allows deps.js to be imported properly.
 *
 * The function is passed the script source, which is a relative URI. It should
 * return true if the script was imported, false otherwise.
 * @type {(function(string): boolean)|undefined}
 */
goog.global.CLOSURE_IMPORT_SCRIPT;


/**
 * Null function used for default values of callbacks, etc.
 * @return {void} Nothing.
 */
goog.nullFunction = function() {};


/**
 * The identity function. Returns its first argument.
 *
 * @param {*=} opt_returnValue The single value that will be returned.
 * @param {...*} var_args Optional trailing arguments. These are ignored.
 * @return {?} The first argument. We can't know the type -- just pass it along
 *      without type.
 * @deprecated Use goog.functions.identity instead.
 */
goog.identityFunction = function(opt_returnValue, var_args) {
  return opt_returnValue;
};


/**
 * When defining a class Foo with an abstract method bar(), you can do:
 * Foo.prototype.bar = goog.abstractMethod
 *
 * Now if a subclass of Foo fails to override bar(), an error will be thrown
 * when bar() is invoked.
 *
 * Note: This does not take the name of the function to override as an argument
 * because that would make it more difficult to obfuscate our JavaScript code.
 *
 * @type {!Function}
 * @throws {Error} when invoked to indicate the method should be overridden.
 */
goog.abstractMethod = function() {
  throw Error('unimplemented abstract method');
};


/**
 * Adds a {@code getInstance} static method that always returns the same
 * instance object.
 * @param {!Function} ctor The constructor for the class to add the static
 *     method to.
 */
goog.addSingletonGetter = function(ctor) {
  ctor.getInstance = function() {
    if (ctor.instance_) {
      return ctor.instance_;
    }
    if (goog.DEBUG) {
      // NOTE: JSCompiler can't optimize away Array#push.
      goog.instantiatedSingletons_[goog.instantiatedSingletons_.length] = ctor;
    }
    return ctor.instance_ = new ctor;
  };
};


/**
 * All singleton classes that have been instantiated, for testing. Don't read
 * it directly, use the {@code goog.testing.singleton} module. The compiler
 * removes this variable if unused.
 * @type {!Array.<!Function>}
 * @private
 */
goog.instantiatedSingletons_ = [];


/**
 * @define {boolean} Whether to load goog.modules using {@code eval} when using
 * the debug loader.  This provides a better debugging experience as the
 * source is unmodified and can be edited using Chrome Workspaces or
 * similiar.  However in some environments the use of {@code eval} is banned
 * so we provide an alternative.
 */
goog.define('goog.LOAD_MODULE_USING_EVAL', true);


/**
 * @define {boolean} Whether the exports of goog.modules should be sealed when
 * possible.
 */
goog.define('goog.SEAL_MODULE_EXPORTS', goog.DEBUG);


/**
 * The registry of initialized modules:
 * the module identifier to module exports map.
 * @private @const {Object.<string, ?>}
 */
goog.loadedModules_ = {};


/**
 * True if goog.dependencies_ is available.
 * @const {boolean}
 */
goog.DEPENDENCIES_ENABLED = !COMPILED && goog.ENABLE_DEBUG_LOADER;


if (goog.DEPENDENCIES_ENABLED) {
  /**
   * Object used to keep track of urls that have already been added. This record
   * allows the prevention of circular dependencies.
   * @type {Object}
   * @private
   */
  goog.included_ = {};


  /**
   * This object is used to keep track of dependencies and other data that is
   * used for loading scripts.
   * @private
   * @type {Object}
   */
  goog.dependencies_ = {
    pathIsModule: {}, // 1 to 1
    nameToPath: {}, // many to 1
    requires: {}, // 1 to many
    // Used when resolving dependencies to prevent us from visiting file twice.
    visited: {},
    written: {} // Used to keep track of script files we have written.
  };


  /**
   * Tries to detect whether is in the context of an HTML document.
   * @return {boolean} True if it looks like HTML document.
   * @private
   */
  goog.inHtmlDocument_ = function() {
    var doc = goog.global.document;
    return typeof doc != 'undefined' &&
           'write' in doc;  // XULDocument misses write.
  };


  /**
   * Tries to detect the base path of base.js script that bootstraps Closure.
   * @private
   */
  goog.findBasePath_ = function() {
    if (goog.global.CLOSURE_BASE_PATH) {
      goog.basePath = goog.global.CLOSURE_BASE_PATH;
      return;
    } else if (!goog.inHtmlDocument_()) {
      return;
    }
    var doc = goog.global.document;
    var scripts = doc.getElementsByTagName('script');
    // Search backwards since the current script is in almost all cases the one
    // that has base.js.
    for (var i = scripts.length - 1; i >= 0; --i) {
      var src = scripts[i].src;
      var qmark = src.lastIndexOf('?');
      var l = qmark == -1 ? src.length : qmark;
      if (src.substr(l - 7, 7) == 'base.js') {
        goog.basePath = src.substr(0, l - 7);
        return;
      }
    }
  };


  /**
   * Imports a script if, and only if, that script hasn't already been imported.
   * (Must be called at execution time)
   * @param {string} src Script source.
   * @param {string=} opt_sourceText The optionally source text to evaluate
   * @private
   */
  goog.importScript_ = function(src, opt_sourceText) {
    var importScript = goog.global.CLOSURE_IMPORT_SCRIPT ||
        goog.writeScriptTag_;
    if (importScript(src, opt_sourceText)) {
      goog.dependencies_.written[src] = true;
    }
  };


  /** @const @private {boolean} */
  goog.IS_OLD_IE_ = goog.global.document &&
      goog.global.document.all && !goog.global.atob;


  /**
   * Given a URL initiate retrieval and execution of the module.
   * @param {string} src Script source URL.
   * @private
   */
  goog.importModule_ = function(src) {
    // In an attempt to keep browsers from timing out loading scripts using
    // synchronous XHRs, put each load in its own script block.
    var bootstrap = 'goog.retrieveAndExecModule_("' + src + '");';

    if (goog.importScript_('', bootstrap)) {
      goog.dependencies_.written[src] = true;
    }
  };


  /** @private {Array.<string>} */
  goog.queuedModules_ = [];


  /**
   * Retrieve and execute a module.
   * @param {string} src Script source URL.
   * @private
   */
  goog.retrieveAndExecModule_ = function(src) {
    // Canonicalize the path, removing any /./ or /../ since Chrome's debugging
    // console doesn't auto-canonicalize XHR loads as it does <script> srcs.
    var separator;
    while ((separator = src.indexOf('/./')) != -1) {
      src = src.substr(0, separator) + src.substr(separator + '/.'.length);
    }
    while ((separator = src.indexOf('/../')) != -1) {
      var previousComponent = src.lastIndexOf('/', separator - 1);
      src = src.substr(0, previousComponent) +
          src.substr(separator + '/..'.length);
    }

    var importScript = goog.global.CLOSURE_IMPORT_SCRIPT ||
        goog.writeScriptTag_;

    var scriptText = null;

    var xhr = new goog.global['XMLHttpRequest']();

    /** @this {Object} */
    xhr.onload = function() {
      scriptText = this.responseText;
    };
    xhr.open('get', src, false);
    xhr.send();

    scriptText = xhr.responseText;

    if (scriptText != null) {
      var execModuleScript = goog.wrapModule_(src, scriptText);
      var isOldIE = goog.IS_OLD_IE_;
      if (isOldIE) {
        goog.queuedModules_.push(execModuleScript);
      } else {
        importScript(src, execModuleScript);
      }
      goog.dependencies_.written[src] = true;
    } else {
      throw new Error('load of ' + src + 'failed');
    }
  };


  /**
   * Return an appropriate module text. Suitable to insert into
   * a script tag (that is unescaped).
   * @param {string} srcUrl
   * @param {string} scriptText
   * @return {string}
   * @private
   */
  goog.wrapModule_ = function(srcUrl, scriptText) {
    if (!goog.LOAD_MODULE_USING_EVAL || !goog.isDef(goog.global.JSON)) {
      return '' +
          'goog.loadModule(function(exports) {' +
          '"use strict";' +
          scriptText +
          '\n' + // terminate any trailing single line comment.
          ';return exports' +
          '});' +
          '\n//# sourceURL=' + srcUrl + '\n';
    } else {
      return '' +
          'goog.loadModule(' +
          goog.global.JSON.stringify(
              scriptText + '\n//# sourceURL=' + srcUrl + '\n') +
          ');';
    }
  };


  /**
   * Load any deferred goog.module loads.
   * @private
   */
  goog.loadQueuedModules_ = function() {
    var count = goog.queuedModules_.length;
    if (count > 0) {
      var queue = goog.queuedModules_;
      goog.queuedModules_ = [];
      for (var i = 0; i < count; i++) {
        var entry = queue[i];
        goog.globalEval(entry);
      }
    }
  };


  /**
   * @param {function(?):?|string} moduleDef The module definition.
   */
  goog.loadModule = function(moduleDef) {
    // NOTE: we allow function definitions to be either in the from
    // of a string to eval (which keeps the original source intact) or
    // in a eval forbidden environment (CSP) we allow a function definition
    // which in its body must call {@code goog.module}, and return the exports
    // of the module.
    try {
      goog.moduleLoaderState_ = {
          moduleName: undefined, declareTestMethods: false};
      var exports;
      if (goog.isFunction(moduleDef)) {
        exports = moduleDef.call(goog.global, {});
      } else if (goog.isString(moduleDef)) {
        exports = goog.loadModuleFromSource_.call(goog.global, moduleDef);
      } else {
        throw Error('Invalid module definition');
      }

      var moduleName = goog.moduleLoaderState_.moduleName;
      if (!goog.isString(moduleName) || !moduleName) {
        throw Error('Invalid module name \"' + moduleName + '\"');
      }

      // Don't seal legacy namespaces as they may be uses as a parent of
      // another namespace
      if (goog.moduleLoaderState_.declareLegacyNamespace) {
        goog.constructNamespace_(moduleName, exports);
      } else if (goog.SEAL_MODULE_EXPORTS && Object.seal) {
        Object.seal(exports);
      }

      goog.loadedModules_[moduleName] = exports;
      if (goog.moduleLoaderState_.declareTestMethods) {
        for (var entry in exports) {
          if (entry.indexOf('test', 0) === 0 ||
              entry == 'tearDown' ||
              entry == 'setup') {
            goog.global[entry] = exports[entry];
          }
        }
      }
    } finally {
      goog.moduleLoaderState_ = null;
    }
  };


  /**
   * @private @const {function(string):?}
   */
  goog.loadModuleFromSource_ = function() {
    // NOTE: we avoid declaring parameters or local variables here to avoid
    // masking globals or leaking values into the module definition.
    'use strict';
    var exports = {};
    eval(arguments[0]);
    return exports;
  };


  /**
   * The default implementation of the import function. Writes a script tag to
   * import the script.
   *
   * @param {string} src The script url.
   * @param {string=} opt_sourceText The optionally source text to evaluate
   * @return {boolean} True if the script was imported, false otherwise.
   * @private
   */
  goog.writeScriptTag_ = function(src, opt_sourceText) {
    if (goog.inHtmlDocument_()) {
      var doc = goog.global.document;

      // If the user tries to require a new symbol after document load,
      // something has gone terribly wrong. Doing a document.write would
      // wipe out the page.
      if (doc.readyState == 'complete') {
        // Certain test frameworks load base.js multiple times, which tries
        // to write deps.js each time. If that happens, just fail silently.
        // These frameworks wipe the page between each load of base.js, so this
        // is OK.
        var isDeps = /\bdeps.js$/.test(src);
        if (isDeps) {
          return false;
        } else {
          throw Error('Cannot write "' + src + '" after document load');
        }
      }

      var isOldIE = goog.IS_OLD_IE_;

      if (opt_sourceText === undefined) {
        if (!isOldIE) {
          doc.write(
              '<script type="text/javascript" src="' +
                  src + '"></' + 'script>');
        } else {
          var state = " onreadystatechange='goog.onScriptLoad_(this, " +
              ++goog.lastNonModuleScriptIndex_ + ")' ";
          doc.write(
              '<script type="text/javascript" src="' +
                  src + '"' + state + '></' + 'script>');
        }
      } else {
        doc.write(
            '<script type="text/javascript">' +
            opt_sourceText +
            '</' + 'script>');
      }
      return true;
    } else {
      return false;
    }
  };


  /** @private {number} */
  goog.lastNonModuleScriptIndex_ = 0;


  /**
   * A readystatechange handler for legacy IE
   * @param {HTMLScriptElement} script
   * @param {number} scriptIndex
   * @return {boolean}
   * @private
   */
  goog.onScriptLoad_ = function(script, scriptIndex) {
    // for now load the modules when we reach the last script,
    // later allow more inter-mingling.
    if (script.readyState == 'complete' &&
        goog.lastNonModuleScriptIndex_ == scriptIndex) {
      goog.loadQueuedModules_();
    }
    return true;
  };

  /**
   * Resolves dependencies based on the dependencies added using addDependency
   * and calls importScript_ in the correct order.
   * @private
   */
  goog.writeScripts_ = function() {
    // The scripts we need to write this time.
    var scripts = [];
    var seenScript = {};
    var deps = goog.dependencies_;

    function visitNode(path) {
      if (path in deps.written) {
        return;
      }

      // We have already visited this one. We can get here if we have cyclic
      // dependencies.
      if (path in deps.visited) {
        if (!(path in seenScript)) {
          seenScript[path] = true;
          scripts.push(path);
        }
        return;
      }

      deps.visited[path] = true;

      if (path in deps.requires) {
        for (var requireName in deps.requires[path]) {
          // If the required name is defined, we assume that it was already
          // bootstrapped by other means.
          if (!goog.isProvided_(requireName)) {
            if (requireName in deps.nameToPath) {
              visitNode(deps.nameToPath[requireName]);
            } else {
              throw Error('Undefined nameToPath for ' + requireName);
            }
          }
        }
      }

      if (!(path in seenScript)) {
        seenScript[path] = true;
        scripts.push(path);
      }
    }

    for (var path in goog.included_) {
      if (!deps.written[path]) {
        visitNode(path);
      }
    }

    // record that we are going to load all these scripts.
    for (var i = 0; i < scripts.length; i++) {
      var path = scripts[i];
      goog.dependencies_.written[path] = true;
    }

    // If a module is loaded synchronously then we need to
    // clear the current inModuleLoader value, and restore it when we are
    // done loading the current "requires".
    var moduleState = goog.moduleLoaderState_;
    goog.moduleLoaderState_ = null;

    var loadingModule = false;
    for (var i = 0; i < scripts.length; i++) {
      var path = scripts[i];
      if (path) {
        if (!deps.pathIsModule[path]) {
          goog.importScript_(goog.basePath + path);
        } else {
          loadingModule = true;
          goog.importModule_(goog.basePath + path);
        }
      } else {
        goog.moduleLoaderState_ = moduleState;
        throw Error('Undefined script input');
      }
    }

    // restore the current "module loading state"
    goog.moduleLoaderState_ = moduleState;
  };


  /**
   * Looks at the dependency rules and tries to determine the script file that
   * fulfills a particular rule.
   * @param {string} rule In the form goog.namespace.Class or project.script.
   * @return {?string} Url corresponding to the rule, or null.
   * @private
   */
  goog.getPathFromDeps_ = function(rule) {
    if (rule in goog.dependencies_.nameToPath) {
      return goog.dependencies_.nameToPath[rule];
    } else {
      return null;
    }
  };

  goog.findBasePath_();

  // Allow projects to manage the deps files themselves.
  if (!goog.global.CLOSURE_NO_DEPS) {
    goog.importScript_(goog.basePath + 'deps.js');
  }
}



//==============================================================================
// Language Enhancements
//==============================================================================


/**
 * This is a "fixed" version of the typeof operator.  It differs from the typeof
 * operator in such a way that null returns 'null' and arrays return 'array'.
 * @param {*} value The value to get the type of.
 * @return {string} The name of the type.
 */
goog.typeOf = function(value) {
  var s = typeof value;
  if (s == 'object') {
    if (value) {
      // Check these first, so we can avoid calling Object.prototype.toString if
      // possible.
      //
      // IE improperly marshals tyepof across execution contexts, but a
      // cross-context object will still return false for "instanceof Object".
      if (value instanceof Array) {
        return 'array';
      } else if (value instanceof Object) {
        return s;
      }

      // HACK: In order to use an Object prototype method on the arbitrary
      //   value, the compiler requires the value be cast to type Object,
      //   even though the ECMA spec explicitly allows it.
      var className = Object.prototype.toString.call(
          /** @type {Object} */ (value));
      // In Firefox 3.6, attempting to access iframe window objects' length
      // property throws an NS_ERROR_FAILURE, so we need to special-case it
      // here.
      if (className == '[object Window]') {
        return 'object';
      }

      // We cannot always use constructor == Array or instanceof Array because
      // different frames have different Array objects. In IE6, if the iframe
      // where the array was created is destroyed, the array loses its
      // prototype. Then dereferencing val.splice here throws an exception, so
      // we can't use goog.isFunction. Calling typeof directly returns 'unknown'
      // so that will work. In this case, this function will return false and
      // most array functions will still work because the array is still
      // array-like (supports length and []) even though it has lost its
      // prototype.
      // Mark Miller noticed that Object.prototype.toString
      // allows access to the unforgeable [[Class]] property.
      //  15.2.4.2 Object.prototype.toString ( )
      //  When the toString method is called, the following steps are taken:
      //      1. Get the [[Class]] property of this object.
      //      2. Compute a string value by concatenating the three strings
      //         "[object ", Result(1), and "]".
      //      3. Return Result(2).
      // and this behavior survives the destruction of the execution context.
      if ((className == '[object Array]' ||
           // In IE all non value types are wrapped as objects across window
           // boundaries (not iframe though) so we have to do object detection
           // for this edge case.
           typeof value.length == 'number' &&
           typeof value.splice != 'undefined' &&
           typeof value.propertyIsEnumerable != 'undefined' &&
           !value.propertyIsEnumerable('splice')

          )) {
        return 'array';
      }
      // HACK: There is still an array case that fails.
      //     function ArrayImpostor() {}
      //     ArrayImpostor.prototype = [];
      //     var impostor = new ArrayImpostor;
      // this can be fixed by getting rid of the fast path
      // (value instanceof Array) and solely relying on
      // (value && Object.prototype.toString.vall(value) === '[object Array]')
      // but that would require many more function calls and is not warranted
      // unless closure code is receiving objects from untrusted sources.

      // IE in cross-window calls does not correctly marshal the function type
      // (it appears just as an object) so we cannot use just typeof val ==
      // 'function'. However, if the object has a call property, it is a
      // function.
      if ((className == '[object Function]' ||
          typeof value.call != 'undefined' &&
          typeof value.propertyIsEnumerable != 'undefined' &&
          !value.propertyIsEnumerable('call'))) {
        return 'function';
      }

    } else {
      return 'null';
    }

  } else if (s == 'function' && typeof value.call == 'undefined') {
    // In Safari typeof nodeList returns 'function', and on Firefox typeof
    // behaves similarly for HTML{Applet,Embed,Object}, Elements and RegExps. We
    // would like to return object for those and we can detect an invalid
    // function by making sure that the function object has a call method.
    return 'object';
  }
  return s;
};


/**
 * Returns true if the specified value is null.
 * @param {?} val Variable to test.
 * @return {boolean} Whether variable is null.
 */
goog.isNull = function(val) {
  return val === null;
};


/**
 * Returns true if the specified value is defined and not null.
 * @param {?} val Variable to test.
 * @return {boolean} Whether variable is defined and not null.
 */
goog.isDefAndNotNull = function(val) {
  // Note that undefined == null.
  return val != null;
};


/**
 * Returns true if the specified value is an array.
 * @param {?} val Variable to test.
 * @return {boolean} Whether variable is an array.
 */
goog.isArray = function(val) {
  return goog.typeOf(val) == 'array';
};


/**
 * Returns true if the object looks like an array. To qualify as array like
 * the value needs to be either a NodeList or an object with a Number length
 * property.
 * @param {?} val Variable to test.
 * @return {boolean} Whether variable is an array.
 */
goog.isArrayLike = function(val) {
  var type = goog.typeOf(val);
  return type == 'array' || type == 'object' && typeof val.length == 'number';
};


/**
 * Returns true if the object looks like a Date. To qualify as Date-like the
 * value needs to be an object and have a getFullYear() function.
 * @param {?} val Variable to test.
 * @return {boolean} Whether variable is a like a Date.
 */
goog.isDateLike = function(val) {
  return goog.isObject(val) && typeof val.getFullYear == 'function';
};


/**
 * Returns true if the specified value is a string.
 * @param {?} val Variable to test.
 * @return {boolean} Whether variable is a string.
 */
goog.isString = function(val) {
  return typeof val == 'string';
};


/**
 * Returns true if the specified value is a boolean.
 * @param {?} val Variable to test.
 * @return {boolean} Whether variable is boolean.
 */
goog.isBoolean = function(val) {
  return typeof val == 'boolean';
};


/**
 * Returns true if the specified value is a number.
 * @param {?} val Variable to test.
 * @return {boolean} Whether variable is a number.
 */
goog.isNumber = function(val) {
  return typeof val == 'number';
};


/**
 * Returns true if the specified value is a function.
 * @param {?} val Variable to test.
 * @return {boolean} Whether variable is a function.
 */
goog.isFunction = function(val) {
  return goog.typeOf(val) == 'function';
};


/**
 * Returns true if the specified value is an object.  This includes arrays and
 * functions.
 * @param {?} val Variable to test.
 * @return {boolean} Whether variable is an object.
 */
goog.isObject = function(val) {
  var type = typeof val;
  return type == 'object' && val != null || type == 'function';
  // return Object(val) === val also works, but is slower, especially if val is
  // not an object.
};


/**
 * Gets a unique ID for an object. This mutates the object so that further calls
 * with the same object as a parameter returns the same value. The unique ID is
 * guaranteed to be unique across the current session amongst objects that are
 * passed into {@code getUid}. There is no guarantee that the ID is unique or
 * consistent across sessions. It is unsafe to generate unique ID for function
 * prototypes.
 *
 * @param {Object} obj The object to get the unique ID for.
 * @return {number} The unique ID for the object.
 */
goog.getUid = function(obj) {
  // TODO(arv): Make the type stricter, do not accept null.

  // In Opera window.hasOwnProperty exists but always returns false so we avoid
  // using it. As a consequence the unique ID generated for BaseClass.prototype
  // and SubClass.prototype will be the same.
  return obj[goog.UID_PROPERTY_] ||
      (obj[goog.UID_PROPERTY_] = ++goog.uidCounter_);
};


/**
 * Whether the given object is alreay assigned a unique ID.
 *
 * This does not modify the object.
 *
 * @param {Object} obj The object to check.
 * @return {boolean} Whether there an assigned unique id for the object.
 */
goog.hasUid = function(obj) {
  return !!obj[goog.UID_PROPERTY_];
};


/**
 * Removes the unique ID from an object. This is useful if the object was
 * previously mutated using {@code goog.getUid} in which case the mutation is
 * undone.
 * @param {Object} obj The object to remove the unique ID field from.
 */
goog.removeUid = function(obj) {
  // TODO(arv): Make the type stricter, do not accept null.

  // In IE, DOM nodes are not instances of Object and throw an exception if we
  // try to delete.  Instead we try to use removeAttribute.
  if ('removeAttribute' in obj) {
    obj.removeAttribute(goog.UID_PROPERTY_);
  }
  /** @preserveTry */
  try {
    delete obj[goog.UID_PROPERTY_];
  } catch (ex) {
  }
};


/**
 * Name for unique ID property. Initialized in a way to help avoid collisions
 * with other closure JavaScript on the same page.
 * @type {string}
 * @private
 */
goog.UID_PROPERTY_ = 'closure_uid_' + ((Math.random() * 1e9) >>> 0);


/**
 * Counter for UID.
 * @type {number}
 * @private
 */
goog.uidCounter_ = 0;


/**
 * Adds a hash code field to an object. The hash code is unique for the
 * given object.
 * @param {Object} obj The object to get the hash code for.
 * @return {number} The hash code for the object.
 * @deprecated Use goog.getUid instead.
 */
goog.getHashCode = goog.getUid;


/**
 * Removes the hash code field from an object.
 * @param {Object} obj The object to remove the field from.
 * @deprecated Use goog.removeUid instead.
 */
goog.removeHashCode = goog.removeUid;


/**
 * Clones a value. The input may be an Object, Array, or basic type. Objects and
 * arrays will be cloned recursively.
 *
 * WARNINGS:
 * <code>goog.cloneObject</code> does not detect reference loops. Objects that
 * refer to themselves will cause infinite recursion.
 *
 * <code>goog.cloneObject</code> is unaware of unique identifiers, and copies
 * UIDs created by <code>getUid</code> into cloned results.
 *
 * @param {*} obj The value to clone.
 * @return {*} A clone of the input value.
 * @deprecated goog.cloneObject is unsafe. Prefer the goog.object methods.
 */
goog.cloneObject = function(obj) {
  var type = goog.typeOf(obj);
  if (type == 'object' || type == 'array') {
    if (obj.clone) {
      return obj.clone();
    }
    var clone = type == 'array' ? [] : {};
    for (var key in obj) {
      clone[key] = goog.cloneObject(obj[key]);
    }
    return clone;
  }

  return obj;
};


/**
 * A native implementation of goog.bind.
 * @param {Function} fn A function to partially apply.
 * @param {Object|undefined} selfObj Specifies the object which this should
 *     point to when the function is run.
 * @param {...*} var_args Additional arguments that are partially applied to the
 *     function.
 * @return {!Function} A partially-applied form of the function bind() was
 *     invoked as a method of.
 * @private
 * @suppress {deprecated} The compiler thinks that Function.prototype.bind is
 *     deprecated because some people have declared a pure-JS version.
 *     Only the pure-JS version is truly deprecated.
 */
goog.bindNative_ = function(fn, selfObj, var_args) {
  return /** @type {!Function} */ (fn.call.apply(fn.bind, arguments));
};


/**
 * A pure-JS implementation of goog.bind.
 * @param {Function} fn A function to partially apply.
 * @param {Object|undefined} selfObj Specifies the object which this should
 *     point to when the function is run.
 * @param {...*} var_args Additional arguments that are partially applied to the
 *     function.
 * @return {!Function} A partially-applied form of the function bind() was
 *     invoked as a method of.
 * @private
 */
goog.bindJs_ = function(fn, selfObj, var_args) {
  if (!fn) {
    throw new Error();
  }

  if (arguments.length > 2) {
    var boundArgs = Array.prototype.slice.call(arguments, 2);
    return function() {
      // Prepend the bound arguments to the current arguments.
      var newArgs = Array.prototype.slice.call(arguments);
      Array.prototype.unshift.apply(newArgs, boundArgs);
      return fn.apply(selfObj, newArgs);
    };

  } else {
    return function() {
      return fn.apply(selfObj, arguments);
    };
  }
};


/**
 * Partially applies this function to a particular 'this object' and zero or
 * more arguments. The result is a new function with some arguments of the first
 * function pre-filled and the value of this 'pre-specified'.
 *
 * Remaining arguments specified at call-time are appended to the pre-specified
 * ones.
 *
 * Also see: {@link #partial}.
 *
 * Usage:
 * <pre>var barMethBound = bind(myFunction, myObj, 'arg1', 'arg2');
 * barMethBound('arg3', 'arg4');</pre>
 *
 * @param {?function(this:T, ...)} fn A function to partially apply.
 * @param {T} selfObj Specifies the object which this should point to when the
 *     function is run.
 * @param {...*} var_args Additional arguments that are partially applied to the
 *     function.
 * @return {!Function} A partially-applied form of the function bind() was
 *     invoked as a method of.
 * @template T
 * @suppress {deprecated} See above.
 */
goog.bind = function(fn, selfObj, var_args) {
  // TODO(nicksantos): narrow the type signature.
  if (Function.prototype.bind &&
      // NOTE(nicksantos): Somebody pulled base.js into the default Chrome
      // extension environment. This means that for Chrome extensions, they get
      // the implementation of Function.prototype.bind that calls goog.bind
      // instead of the native one. Even worse, we don't want to introduce a
      // circular dependency between goog.bind and Function.prototype.bind, so
      // we have to hack this to make sure it works correctly.
      Function.prototype.bind.toString().indexOf('native code') != -1) {
    goog.bind = goog.bindNative_;
  } else {
    goog.bind = goog.bindJs_;
  }
  return goog.bind.apply(null, arguments);
};


/**
 * Like bind(), except that a 'this object' is not required. Useful when the
 * target function is already bound.
 *
 * Usage:
 * var g = partial(f, arg1, arg2);
 * g(arg3, arg4);
 *
 * @param {Function} fn A function to partially apply.
 * @param {...*} var_args Additional arguments that are partially applied to fn.
 * @return {!Function} A partially-applied form of the function bind() was
 *     invoked as a method of.
 */
goog.partial = function(fn, var_args) {
  var args = Array.prototype.slice.call(arguments, 1);
  return function() {
    // Clone the array (with slice()) and append additional arguments
    // to the existing arguments.
    var newArgs = args.slice();
    newArgs.push.apply(newArgs, arguments);
    return fn.apply(this, newArgs);
  };
};


/**
 * Copies all the members of a source object to a target object. This method
 * does not work on all browsers for all objects that contain keys such as
 * toString or hasOwnProperty. Use goog.object.extend for this purpose.
 * @param {Object} target Target.
 * @param {Object} source Source.
 */
goog.mixin = function(target, source) {
  for (var x in source) {
    target[x] = source[x];
  }

  // For IE7 or lower, the for-in-loop does not contain any properties that are
  // not enumerable on the prototype object (for example, isPrototypeOf from
  // Object.prototype) but also it will not include 'replace' on objects that
  // extend String and change 'replace' (not that it is common for anyone to
  // extend anything except Object).
};


/**
 * @return {number} An integer value representing the number of milliseconds
 *     between midnight, January 1, 1970 and the current time.
 */
goog.now = (goog.TRUSTED_SITE && Date.now) || (function() {
  // Unary plus operator converts its operand to a number which in the case of
  // a date is done by calling getTime().
  return +new Date();
});


/**
 * Evals JavaScript in the global scope.  In IE this uses execScript, other
 * browsers use goog.global.eval. If goog.global.eval does not evaluate in the
 * global scope (for example, in Safari), appends a script tag instead.
 * Throws an exception if neither execScript or eval is defined.
 * @param {string} script JavaScript string.
 */
goog.globalEval = function(script) {
  if (goog.global.execScript) {
    goog.global.execScript(script, 'JavaScript');
  } else if (goog.global.eval) {
    // Test to see if eval works
    if (goog.evalWorksForGlobals_ == null) {
      goog.global.eval('var _et_ = 1;');
      if (typeof goog.global['_et_'] != 'undefined') {
        delete goog.global['_et_'];
        goog.evalWorksForGlobals_ = true;
      } else {
        goog.evalWorksForGlobals_ = false;
      }
    }

    if (goog.evalWorksForGlobals_) {
      goog.global.eval(script);
    } else {
      var doc = goog.global.document;
      var scriptElt = doc.createElement('script');
      scriptElt.type = 'text/javascript';
      scriptElt.defer = false;
      // Note(user): can't use .innerHTML since "t('<test>')" will fail and
      // .text doesn't work in Safari 2.  Therefore we append a text node.
      scriptElt.appendChild(doc.createTextNode(script));
      doc.body.appendChild(scriptElt);
      doc.body.removeChild(scriptElt);
    }
  } else {
    throw Error('goog.globalEval not available');
  }
};


/**
 * Indicates whether or not we can call 'eval' directly to eval code in the
 * global scope. Set to a Boolean by the first call to goog.globalEval (which
 * empirically tests whether eval works for globals). @see goog.globalEval
 * @type {?boolean}
 * @private
 */
goog.evalWorksForGlobals_ = null;


/**
 * Optional map of CSS class names to obfuscated names used with
 * goog.getCssName().
 * @type {Object|undefined}
 * @private
 * @see goog.setCssNameMapping
 */
goog.cssNameMapping_;


/**
 * Optional obfuscation style for CSS class names. Should be set to either
 * 'BY_WHOLE' or 'BY_PART' if defined.
 * @type {string|undefined}
 * @private
 * @see goog.setCssNameMapping
 */
goog.cssNameMappingStyle_;


/**
 * Handles strings that are intended to be used as CSS class names.
 *
 * This function works in tandem with @see goog.setCssNameMapping.
 *
 * Without any mapping set, the arguments are simple joined with a hyphen and
 * passed through unaltered.
 *
 * When there is a mapping, there are two possible styles in which these
 * mappings are used. In the BY_PART style, each part (i.e. in between hyphens)
 * of the passed in css name is rewritten according to the map. In the BY_WHOLE
 * style, the full css name is looked up in the map directly. If a rewrite is
 * not specified by the map, the compiler will output a warning.
 *
 * When the mapping is passed to the compiler, it will replace calls to
 * goog.getCssName with the strings from the mapping, e.g.
 *     var x = goog.getCssName('foo');
 *     var y = goog.getCssName(this.baseClass, 'active');
 *  becomes:
 *     var x= 'foo';
 *     var y = this.baseClass + '-active';
 *
 * If one argument is passed it will be processed, if two are passed only the
 * modifier will be processed, as it is assumed the first argument was generated
 * as a result of calling goog.getCssName.
 *
 * @param {string} className The class name.
 * @param {string=} opt_modifier A modifier to be appended to the class name.
 * @return {string} The class name or the concatenation of the class name and
 *     the modifier.
 */
goog.getCssName = function(className, opt_modifier) {
  var getMapping = function(cssName) {
    return goog.cssNameMapping_[cssName] || cssName;
  };

  var renameByParts = function(cssName) {
    // Remap all the parts individually.
    var parts = cssName.split('-');
    var mapped = [];
    for (var i = 0; i < parts.length; i++) {
      mapped.push(getMapping(parts[i]));
    }
    return mapped.join('-');
  };

  var rename;
  if (goog.cssNameMapping_) {
    rename = goog.cssNameMappingStyle_ == 'BY_WHOLE' ?
        getMapping : renameByParts;
  } else {
    rename = function(a) {
      return a;
    };
  }

  if (opt_modifier) {
    return className + '-' + rename(opt_modifier);
  } else {
    return rename(className);
  }
};


/**
 * Sets the map to check when returning a value from goog.getCssName(). Example:
 * <pre>
 * goog.setCssNameMapping({
 *   "goog": "a",
 *   "disabled": "b",
 * });
 *
 * var x = goog.getCssName('goog');
 * // The following evaluates to: "a a-b".
 * goog.getCssName('goog') + ' ' + goog.getCssName(x, 'disabled')
 * </pre>
 * When declared as a map of string literals to string literals, the JSCompiler
 * will replace all calls to goog.getCssName() using the supplied map if the
 * --closure_pass flag is set.
 *
 * @param {!Object} mapping A map of strings to strings where keys are possible
 *     arguments to goog.getCssName() and values are the corresponding values
 *     that should be returned.
 * @param {string=} opt_style The style of css name mapping. There are two valid
 *     options: 'BY_PART', and 'BY_WHOLE'.
 * @see goog.getCssName for a description.
 */
goog.setCssNameMapping = function(mapping, opt_style) {
  goog.cssNameMapping_ = mapping;
  goog.cssNameMappingStyle_ = opt_style;
};


/**
 * To use CSS renaming in compiled mode, one of the input files should have a
 * call to goog.setCssNameMapping() with an object literal that the JSCompiler
 * can extract and use to replace all calls to goog.getCssName(). In uncompiled
 * mode, JavaScript code should be loaded before this base.js file that declares
 * a global variable, CLOSURE_CSS_NAME_MAPPING, which is used below. This is
 * to ensure that the mapping is loaded before any calls to goog.getCssName()
 * are made in uncompiled mode.
 *
 * A hook for overriding the CSS name mapping.
 * @type {Object|undefined}
 */
goog.global.CLOSURE_CSS_NAME_MAPPING;


if (!COMPILED && goog.global.CLOSURE_CSS_NAME_MAPPING) {
  // This does not call goog.setCssNameMapping() because the JSCompiler
  // requires that goog.setCssNameMapping() be called with an object literal.
  goog.cssNameMapping_ = goog.global.CLOSURE_CSS_NAME_MAPPING;
}


/**
 * Gets a localized message.
 *
 * This function is a compiler primitive. If you give the compiler a localized
 * message bundle, it will replace the string at compile-time with a localized
 * version, and expand goog.getMsg call to a concatenated string.
 *
 * Messages must be initialized in the form:
 * <code>
 * var MSG_NAME = goog.getMsg('Hello {$placeholder}', {'placeholder': 'world'});
 * </code>
 *
 * @param {string} str Translatable string, places holders in the form {$foo}.
 * @param {Object=} opt_values Map of place holder name to value.
 * @return {string} message with placeholders filled.
 */
goog.getMsg = function(str, opt_values) {
  if (opt_values) {
    str = str.replace(/\{\$([^}]+)}/g, function(match, key) {
      return key in opt_values ? opt_values[key] : match;
    });
  }
  return str;
};


/**
 * Gets a localized message. If the message does not have a translation, gives a
 * fallback message.
 *
 * This is useful when introducing a new message that has not yet been
 * translated into all languages.
 *
 * This function is a compiler primitive. Must be used in the form:
 * <code>var x = goog.getMsgWithFallback(MSG_A, MSG_B);</code>
 * where MSG_A and MSG_B were initialized with goog.getMsg.
 *
 * @param {string} a The preferred message.
 * @param {string} b The fallback message.
 * @return {string} The best translated message.
 */
goog.getMsgWithFallback = function(a, b) {
  return a;
};


/**
 * Exposes an unobfuscated global namespace path for the given object.
 * Note that fields of the exported object *will* be obfuscated, unless they are
 * exported in turn via this function or goog.exportProperty.
 *
 * Also handy for making public items that are defined in anonymous closures.
 *
 * ex. goog.exportSymbol('public.path.Foo', Foo);
 *
 * ex. goog.exportSymbol('public.path.Foo.staticFunction', Foo.staticFunction);
 *     public.path.Foo.staticFunction();
 *
 * ex. goog.exportSymbol('public.path.Foo.prototype.myMethod',
 *                       Foo.prototype.myMethod);
 *     new public.path.Foo().myMethod();
 *
 * @param {string} publicPath Unobfuscated name to export.
 * @param {*} object Object the name should point to.
 * @param {Object=} opt_objectToExportTo The object to add the path to; default
 *     is goog.global.
 */
goog.exportSymbol = function(publicPath, object, opt_objectToExportTo) {
  goog.exportPath_(publicPath, object, opt_objectToExportTo);
};


/**
 * Exports a property unobfuscated into the object's namespace.
 * ex. goog.exportProperty(Foo, 'staticFunction', Foo.staticFunction);
 * ex. goog.exportProperty(Foo.prototype, 'myMethod', Foo.prototype.myMethod);
 * @param {Object} object Object whose static property is being exported.
 * @param {string} publicName Unobfuscated name to export.
 * @param {*} symbol Object the name should point to.
 */
goog.exportProperty = function(object, publicName, symbol) {
  object[publicName] = symbol;
};


/**
 * Inherit the prototype methods from one constructor into another.
 *
 * Usage:
 * <pre>
 * function ParentClass(a, b) { }
 * ParentClass.prototype.foo = function(a) { };
 *
 * function ChildClass(a, b, c) {
 *   ChildClass.base(this, 'constructor', a, b);
 * }
 * goog.inherits(ChildClass, ParentClass);
 *
 * var child = new ChildClass('a', 'b', 'see');
 * child.foo(); // This works.
 * </pre>
 *
 * @param {Function} childCtor Child class.
 * @param {Function} parentCtor Parent class.
 */
goog.inherits = function(childCtor, parentCtor) {
  /** @constructor */
  function tempCtor() {};
  tempCtor.prototype = parentCtor.prototype;
  childCtor.superClass_ = parentCtor.prototype;
  childCtor.prototype = new tempCtor();
  /** @override */
  childCtor.prototype.constructor = childCtor;

  /**
   * Calls superclass constructor/method.
   *
   * This function is only available if you use goog.inherits to
   * express inheritance relationships between classes.
   *
   * NOTE: This is a replacement for goog.base and for superClass_
   * property defined in childCtor.
   *
   * @param {!Object} me Should always be "this".
   * @param {string} methodName The method name to call. Calling
   *     superclass constructor can be done with the special string
   *     'constructor'.
   * @param {...*} var_args The arguments to pass to superclass
   *     method/constructor.
   * @return {*} The return value of the superclass method/constructor.
   */
  childCtor.base = function(me, methodName, var_args) {
    var args = Array.prototype.slice.call(arguments, 2);
    return parentCtor.prototype[methodName].apply(me, args);
  };
};


/**
 * Call up to the superclass.
 *
 * If this is called from a constructor, then this calls the superclass
 * constructor with arguments 1-N.
 *
 * If this is called from a prototype method, then you must pass the name of the
 * method as the second argument to this function. If you do not, you will get a
 * runtime error. This calls the superclass' method with arguments 2-N.
 *
 * This function only works if you use goog.inherits to express inheritance
 * relationships between your classes.
 *
 * This function is a compiler primitive. At compile-time, the compiler will do
 * macro expansion to remove a lot of the extra overhead that this function
 * introduces. The compiler will also enforce a lot of the assumptions that this
 * function makes, and treat it as a compiler error if you break them.
 *
 * @param {!Object} me Should always be "this".
 * @param {*=} opt_methodName The method name if calling a super method.
 * @param {...*} var_args The rest of the arguments.
 * @return {*} The return value of the superclass method.
 * @suppress {es5Strict} This method can not be used in strict mode, but
 *     all Closure Library consumers must depend on this file.
 */
goog.base = function(me, opt_methodName, var_args) {
  var caller = arguments.callee.caller;

  if (goog.STRICT_MODE_COMPATIBLE || (goog.DEBUG && !caller)) {
    throw Error('arguments.caller not defined.  goog.base() cannot be used ' +
                'with strict mode code. See ' +
                'http://www.ecma-international.org/ecma-262/5.1/#sec-C');
  }

  if (caller.superClass_) {
    // This is a constructor. Call the superclass constructor.
    return caller.superClass_.constructor.apply(
        me, Array.prototype.slice.call(arguments, 1));
  }

  var args = Array.prototype.slice.call(arguments, 2);
  var foundCaller = false;
  for (var ctor = me.constructor;
       ctor; ctor = ctor.superClass_ && ctor.superClass_.constructor) {
    if (ctor.prototype[opt_methodName] === caller) {
      foundCaller = true;
    } else if (foundCaller) {
      return ctor.prototype[opt_methodName].apply(me, args);
    }
  }

  // If we did not find the caller in the prototype chain, then one of two
  // things happened:
  // 1) The caller is an instance method.
  // 2) This method was not called by the right caller.
  if (me[opt_methodName] === caller) {
    return me.constructor.prototype[opt_methodName].apply(me, args);
  } else {
    throw Error(
        'goog.base called from a method of one name ' +
        'to a method of a different name');
  }
};


/**
 * Allow for aliasing within scope functions.  This function exists for
 * uncompiled code - in compiled code the calls will be inlined and the aliases
 * applied.  In uncompiled code the function is simply run since the aliases as
 * written are valid JavaScript.
 *
 *
 * @param {function()} fn Function to call.  This function can contain aliases
 *     to namespaces (e.g. "var dom = goog.dom") or classes
 *     (e.g. "var Timer = goog.Timer").
 */
goog.scope = function(fn) {
  fn.call(goog.global);
};


/*
 * To support uncompiled, strict mode bundles that use eval to divide source
 * like so:
 *    eval('someSource;//# sourceUrl sourcefile.js');
 * We need to export the globally defined symbols "goog" and "COMPILED".
 * Exporting "goog" breaks the compiler optimizations, so we required that
 * be defined externally.
 * NOTE: We don't use goog.exportSymbol here because we don't want to trigger
 * extern generation when that compiler option is enabled.
 */
if (!COMPILED) {
  goog.global['COMPILED'] = COMPILED;
}



//==============================================================================
// goog.defineClass implementation
//==============================================================================

/**
 * Creates a restricted form of a Closure "class":
 *   - from the compiler's perspective, the instance returned from the
 *     constructor is sealed (no new properties may be added).  This enables
 *     better checks.
 *   - the compiler will rewrite this definition to a form that is optimal
 *     for type checking and optimization (initially this will be a more
 *     traditional form).
 *
 * @param {Function} superClass The superclass, Object or null.
 * @param {goog.defineClass.ClassDescriptor} def
 *     An object literal describing the
 *     the class.  It may have the following properties:
 *     "constructor": the constructor function
 *     "statics": an object literal containing methods to add to the constructor
 *        as "static" methods or a function that will receive the constructor
 *        function as its only parameter to which static properties can
 *        be added.
 *     all other properties are added to the prototype.
 * @return {!Function} The class constructor.
 */
goog.defineClass = function(superClass, def) {
  // TODO(johnlenz): consider making the superClass an optional parameter.
  var constructor = def.constructor;
  var statics = def.statics;
  // Wrap the constructor prior to setting up the prototype and static methods.
  if (!constructor || constructor == Object.prototype.constructor) {
    constructor = function() {
      throw Error('cannot instantiate an interface (no constructor defined).');
    };
  }

  var cls = goog.defineClass.createSealingConstructor_(constructor, superClass);
  if (superClass) {
    goog.inherits(cls, superClass);
  }

  // Remove all the properties that should not be copied to the prototype.
  delete def.constructor;
  delete def.statics;

  goog.defineClass.applyProperties_(cls.prototype, def);
  if (statics != null) {
    if (statics instanceof Function) {
      statics(cls);
    } else {
      goog.defineClass.applyProperties_(cls, statics);
    }
  }

  return cls;
};


/**
 * @typedef {
 *     !Object|
 *     {constructor:!Function}|
 *     {constructor:!Function, statics:(Object|function(Function):void)}}
 */
goog.defineClass.ClassDescriptor;


/**
 * @define {boolean} Whether the instances returned by
 * goog.defineClass should be sealed when possible.
 */
goog.define('goog.defineClass.SEAL_CLASS_INSTANCES', goog.DEBUG);


/**
 * If goog.defineClass.SEAL_CLASS_INSTANCES is enabled and Object.seal is
 * defined, this function will wrap the constructor in a function that seals the
 * results of the provided constructor function.
 *
 * @param {!Function} ctr The constructor whose results maybe be sealed.
 * @param {Function} superClass The superclass constructor.
 * @return {!Function} The replacement constructor.
 * @private
 */
goog.defineClass.createSealingConstructor_ = function(ctr, superClass) {
  if (goog.defineClass.SEAL_CLASS_INSTANCES &&
      Object.seal instanceof Function) {
    // Don't seal subclasses of unsealable-tagged legacy classes.
    if (superClass && superClass.prototype &&
        superClass.prototype[goog.UNSEALABLE_CONSTRUCTOR_PROPERTY_]) {
      return ctr;
    }
    /** @this {*} */
    var wrappedCtr = function() {
      // Don't seal an instance of a subclass when it calls the constructor of
      // its super class as there is most likely still setup to do.
      var instance = ctr.apply(this, arguments) || this;
      instance[goog.UID_PROPERTY_] = instance[goog.UID_PROPERTY_];
      if (this.constructor === wrappedCtr) {
        Object.seal(instance);
      }
      return instance;
    };
    return wrappedCtr;
  }
  return ctr;
};


// TODO(johnlenz): share these values with the goog.object
/**
 * The names of the fields that are defined on Object.prototype.
 * @type {!Array.<string>}
 * @private
 * @const
 */
goog.defineClass.OBJECT_PROTOTYPE_FIELDS_ = [
  'constructor',
  'hasOwnProperty',
  'isPrototypeOf',
  'propertyIsEnumerable',
  'toLocaleString',
  'toString',
  'valueOf'
];


// TODO(johnlenz): share this function with the goog.object
/**
 * @param {!Object} target The object to add properties to.
 * @param {!Object} source The object to copy properites from.
 * @private
 */
goog.defineClass.applyProperties_ = function(target, source) {
  // TODO(johnlenz): update this to support ES5 getters/setters

  var key;
  for (key in source) {
    if (Object.prototype.hasOwnProperty.call(source, key)) {
      target[key] = source[key];
    }
  }

  // For IE the for-in-loop does not contain any properties that are not
  // enumerable on the prototype object (for example isPrototypeOf from
  // Object.prototype) and it will also not include 'replace' on objects that
  // extend String and change 'replace' (not that it is common for anyone to
  // extend anything except Object).
  for (var i = 0; i < goog.defineClass.OBJECT_PROTOTYPE_FIELDS_.length; i++) {
    key = goog.defineClass.OBJECT_PROTOTYPE_FIELDS_[i];
    if (Object.prototype.hasOwnProperty.call(source, key)) {
      target[key] = source[key];
    }
  }
};


/**
 * Sealing classes breaks the older idiom of assigning properties on the
 * prototype rather than in the constructor.  As such, goog.defineClass
 * must not seal subclasses of these old-style classes until they are fixed.
 * Until then, this marks a class as "broken", instructing defineClass
 * not to seal subclasses.
 * @param {!Function} ctr The legacy constructor to tag as unsealable.
 */
goog.tagUnsealableClass = function(ctr) {
  if (!COMPILED && goog.defineClass.SEAL_CLASS_INSTANCES) {
    ctr.prototype[goog.UNSEALABLE_CONSTRUCTOR_PROPERTY_] = true;
  }
};


/**
 * Name for unsealable tag property.
 * @const @private {string}
 */
goog.UNSEALABLE_CONSTRUCTOR_PROPERTY_ = 'goog_defineClass_legacy_unsealable';

// Copyright 2011 The Closure Library Authors. All Rights Reserved.
//
// Licensed under the Apache License, Version 2.0 (the "License");
// you may not use this file except in compliance with the License.
// You may obtain a copy of the License at
//
//      http://www.apache.org/licenses/LICENSE-2.0
//
// Unless required by applicable law or agreed to in writing, software
// distributed under the License is distributed on an "AS-IS" BASIS,
// WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
// See the License for the specific language governing permissions and
// limitations under the License.

/**
 * @fileoverview Definition of the disposable interface.  A disposable object
 * has a dispose method to to clean up references and resources.
 * @author nnaze@google.com (Nathan Naze)
 */


goog.provide('goog.disposable.IDisposable');



/**
 * Interface for a disposable object.  If a instance requires cleanup
 * (references COM objects, DOM notes, or other disposable objects), it should
 * implement this interface (it may subclass goog.Disposable).
 * @interface
 */
goog.disposable.IDisposable = function() {};


/**
 * Disposes of the object and its resources.
 * @return {void} Nothing.
 */
goog.disposable.IDisposable.prototype.dispose = goog.abstractMethod;


/**
 * @return {boolean} Whether the object has been disposed of.
 */
goog.disposable.IDisposable.prototype.isDisposed = goog.abstractMethod;

// Copyright 2005 The Closure Library Authors. All Rights Reserved.
//
// Licensed under the Apache License, Version 2.0 (the "License");
// you may not use this file except in compliance with the License.
// You may obtain a copy of the License at
//
//      http://www.apache.org/licenses/LICENSE-2.0
//
// Unless required by applicable law or agreed to in writing, software
// distributed under the License is distributed on an "AS-IS" BASIS,
// WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
// See the License for the specific language governing permissions and
// limitations under the License.

/**
 * @fileoverview Implements the disposable interface. The dispose method is used
 * to clean up references and resources.
 * @author arv@google.com (Erik Arvidsson)
 */


goog.provide('goog.Disposable');
/** @suppress {extraProvide} */
goog.provide('goog.dispose');
/** @suppress {extraProvide} */
goog.provide('goog.disposeAll');

goog.require('goog.disposable.IDisposable');



/**
 * Class that provides the basic implementation for disposable objects. If your
 * class holds one or more references to COM objects, DOM nodes, or other
 * disposable objects, it should extend this class or implement the disposable
 * interface (defined in goog.disposable.IDisposable).
 * @constructor
 * @implements {goog.disposable.IDisposable}
 */
goog.Disposable = function() {
  if (goog.Disposable.MONITORING_MODE != goog.Disposable.MonitoringMode.OFF) {
    if (goog.Disposable.INCLUDE_STACK_ON_CREATION) {
      this.creationStack = new Error().stack;
    }
    goog.Disposable.instances_[goog.getUid(this)] = this;
  }
  // Support sealing
  this.disposed_ = this.disposed_;
  this.onDisposeCallbacks_ = this.onDisposeCallbacks_;
};


/**
 * @enum {number} Different monitoring modes for Disposable.
 */
goog.Disposable.MonitoringMode = {
  /**
   * No monitoring.
   */
  OFF: 0,
  /**
   * Creating and disposing the goog.Disposable instances is monitored. All
   * disposable objects need to call the {@code goog.Disposable} base
   * constructor. The PERMANENT mode must be switched on before creating any
   * goog.Disposable instances.
   */
  PERMANENT: 1,
  /**
   * INTERACTIVE mode can be switched on and off on the fly without producing
   * errors. It also doesn't warn if the disposable objects don't call the
   * {@code goog.Disposable} base constructor.
   */
  INTERACTIVE: 2
};


/**
 * @define {number} The monitoring mode of the goog.Disposable
 *     instances. Default is OFF. Switching on the monitoring is only
 *     recommended for debugging because it has a significant impact on
 *     performance and memory usage. If switched off, the monitoring code
 *     compiles down to 0 bytes.
 */
goog.define('goog.Disposable.MONITORING_MODE', 0);


/**
 * @define {boolean} Whether to attach creation stack to each created disposable
 *     instance; This is only relevant for when MonitoringMode != OFF.
 */
goog.define('goog.Disposable.INCLUDE_STACK_ON_CREATION', true);


/**
 * Maps the unique ID of every undisposed {@code goog.Disposable} object to
 * the object itself.
 * @type {!Object.<number, !goog.Disposable>}
 * @private
 */
goog.Disposable.instances_ = {};


/**
 * @return {!Array.<!goog.Disposable>} All {@code goog.Disposable} objects that
 *     haven't been disposed of.
 */
goog.Disposable.getUndisposedObjects = function() {
  var ret = [];
  for (var id in goog.Disposable.instances_) {
    if (goog.Disposable.instances_.hasOwnProperty(id)) {
      ret.push(goog.Disposable.instances_[Number(id)]);
    }
  }
  return ret;
};


/**
 * Clears the registry of undisposed objects but doesn't dispose of them.
 */
goog.Disposable.clearUndisposedObjects = function() {
  goog.Disposable.instances_ = {};
};


/**
 * Whether the object has been disposed of.
 * @type {boolean}
 * @private
 */
goog.Disposable.prototype.disposed_ = false;


/**
 * Callbacks to invoke when this object is disposed.
 * @type {Array.<!Function>}
 * @private
 */
goog.Disposable.prototype.onDisposeCallbacks_;


/**
 * If monitoring the goog.Disposable instances is enabled, stores the creation
 * stack trace of the Disposable instance.
 * @const {string}
 */
goog.Disposable.prototype.creationStack;


/**
 * @return {boolean} Whether the object has been disposed of.
 * @override
 */
goog.Disposable.prototype.isDisposed = function() {
  return this.disposed_;
};


/**
 * @return {boolean} Whether the object has been disposed of.
 * @deprecated Use {@link #isDisposed} instead.
 */
goog.Disposable.prototype.getDisposed = goog.Disposable.prototype.isDisposed;


/**
 * Disposes of the object. If the object hasn't already been disposed of, calls
 * {@link #disposeInternal}. Classes that extend {@code goog.Disposable} should
 * override {@link #disposeInternal} in order to delete references to COM
 * objects, DOM nodes, and other disposable objects. Reentrant.
 *
 * @return {void} Nothing.
 * @override
 */
goog.Disposable.prototype.dispose = function() {
  if (!this.disposed_) {
    // Set disposed_ to true first, in case during the chain of disposal this
    // gets disposed recursively.
    this.disposed_ = true;
    this.disposeInternal();
    if (goog.Disposable.MONITORING_MODE != goog.Disposable.MonitoringMode.OFF) {
      var uid = goog.getUid(this);
      if (goog.Disposable.MONITORING_MODE ==
          goog.Disposable.MonitoringMode.PERMANENT &&
          !goog.Disposable.instances_.hasOwnProperty(uid)) {
        throw Error(this + ' did not call the goog.Disposable base ' +
            'constructor or was disposed of after a clearUndisposedObjects ' +
            'call');
      }
      delete goog.Disposable.instances_[uid];
    }
  }
};


/**
 * Associates a disposable object with this object so that they will be disposed
 * together.
 * @param {goog.disposable.IDisposable} disposable that will be disposed when
 *     this object is disposed.
 */
goog.Disposable.prototype.registerDisposable = function(disposable) {
  this.addOnDisposeCallback(goog.partial(goog.dispose, disposable));
};


/**
 * Invokes a callback function when this object is disposed. Callbacks are
 * invoked in the order in which they were added.
 * @param {function(this:T):?} callback The callback function.
 * @param {T=} opt_scope An optional scope to call the callback in.
 * @template T
 */
goog.Disposable.prototype.addOnDisposeCallback = function(callback, opt_scope) {
  if (!this.onDisposeCallbacks_) {
    this.onDisposeCallbacks_ = [];
  }

  this.onDisposeCallbacks_.push(
      goog.isDef(opt_scope) ? goog.bind(callback, opt_scope) : callback);
};


/**
 * Deletes or nulls out any references to COM objects, DOM nodes, or other
 * disposable objects. Classes that extend {@code goog.Disposable} should
 * override this method.
 * Not reentrant. To avoid calling it twice, it must only be called from the
 * subclass' {@code disposeInternal} method. Everywhere else the public
 * {@code dispose} method must be used.
 * For example:
 * <pre>
 *   mypackage.MyClass = function() {
 *     mypackage.MyClass.base(this, 'constructor');
 *     // Constructor logic specific to MyClass.
 *     ...
 *   };
 *   goog.inherits(mypackage.MyClass, goog.Disposable);
 *
 *   mypackage.MyClass.prototype.disposeInternal = function() {
 *     // Dispose logic specific to MyClass.
 *     ...
 *     // Call superclass's disposeInternal at the end of the subclass's, like
 *     // in C++, to avoid hard-to-catch issues.
 *     mypackage.MyClass.base(this, 'disposeInternal');
 *   };
 * </pre>
 * @protected
 */
goog.Disposable.prototype.disposeInternal = function() {
  if (this.onDisposeCallbacks_) {
    while (this.onDisposeCallbacks_.length) {
      this.onDisposeCallbacks_.shift()();
    }
  }
};


/**
 * Returns True if we can verify the object is disposed.
 * Calls {@code isDisposed} on the argument if it supports it.  If obj
 * is not an object with an isDisposed() method, return false.
 * @param {*} obj The object to investigate.
 * @return {boolean} True if we can verify the object is disposed.
 */
goog.Disposable.isDisposed = function(obj) {
  if (obj && typeof obj.isDisposed == 'function') {
    return obj.isDisposed();
  }
  return false;
};


/**
 * Calls {@code dispose} on the argument if it supports it. If obj is not an
 *     object with a dispose() method, this is a no-op.
 * @param {*} obj The object to dispose of.
 */
goog.dispose = function(obj) {
  if (obj && typeof obj.dispose == 'function') {
    obj.dispose();
  }
};


/**
 * Calls {@code dispose} on each member of the list that supports it. (If the
 * member is an ArrayLike, then {@code goog.disposeAll()} will be called
 * recursively on each of its members.) If the member is not an object with a
 * {@code dispose()} method, then it is ignored.
 * @param {...*} var_args The list.
 */
goog.disposeAll = function(var_args) {
  for (var i = 0, len = arguments.length; i < len; ++i) {
    var disposable = arguments[i];
    if (goog.isArrayLike(disposable)) {
      goog.disposeAll.apply(null, disposable);
    } else {
      goog.dispose(disposable);
    }
  }
};

// Copyright 2013 The Closure Library Authors. All Rights Reserved.
//
// Licensed under the Apache License, Version 2.0 (the "License");
// you may not use this file except in compliance with the License.
// You may obtain a copy of the License at
//
//      http://www.apache.org/licenses/LICENSE-2.0
//
// Unless required by applicable law or agreed to in writing, software
// distributed under the License is distributed on an "AS-IS" BASIS,
// WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
// See the License for the specific language governing permissions and
// limitations under the License.

goog.provide('goog.events.EventId');



/**
 * A templated class that is used when registering for events. Typical usage:
 * <code>
 *   /** @type {goog.events.EventId.<MyEventObj>}
 *   var myEventId = new goog.events.EventId(
 *       goog.events.getUniqueId(('someEvent'));
 *
 *   // No need to cast or declare here since the compiler knows the correct
 *   // type of 'evt' (MyEventObj).
 *   something.listen(myEventId, function(evt) {});
 * </code>
 *
 * @param {string} eventId
 * @template T
 * @constructor
 * @struct
 * @final
 */
goog.events.EventId = function(eventId) {
  /** @const */ this.id = eventId;
};


/**
 * @override
 */
goog.events.EventId.prototype.toString = function() {
  return this.id;
};

// Copyright 2005 The Closure Library Authors. All Rights Reserved.
//
// Licensed under the Apache License, Version 2.0 (the "License");
// you may not use this file except in compliance with the License.
// You may obtain a copy of the License at
//
//      http://www.apache.org/licenses/LICENSE-2.0
//
// Unless required by applicable law or agreed to in writing, software
// distributed under the License is distributed on an "AS-IS" BASIS,
// WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
// See the License for the specific language governing permissions and
// limitations under the License.

/**
 * @fileoverview A base class for event objects.
 *
 */


goog.provide('goog.events.Event');
goog.provide('goog.events.EventLike');

/**
 * goog.events.Event no longer depends on goog.Disposable. Keep requiring
 * goog.Disposable here to not break projects which assume this dependency.
 * @suppress {extraRequire}
 */
goog.require('goog.Disposable');
goog.require('goog.events.EventId');


/**
 * A typedef for event like objects that are dispatchable via the
 * goog.events.dispatchEvent function. strings are treated as the type for a
 * goog.events.Event. Objects are treated as an extension of a new
 * goog.events.Event with the type property of the object being used as the type
 * of the Event.
 * @typedef {string|Object|goog.events.Event|goog.events.EventId}
 */
goog.events.EventLike;



/**
 * A base class for event objects, so that they can support preventDefault and
 * stopPropagation.
 *
 * @param {string|!goog.events.EventId} type Event Type.
 * @param {Object=} opt_target Reference to the object that is the target of
 *     this event. It has to implement the {@code EventTarget} interface
 *     declared at {@link http://developer.mozilla.org/en/DOM/EventTarget}.
 * @constructor
 */
goog.events.Event = function(type, opt_target) {
  /**
   * Event type.
   * @type {string}
   */
  this.type = type instanceof goog.events.EventId ? String(type) : type;

  /**
   * TODO(tbreisacher): The type should probably be
   * EventTarget|goog.events.EventTarget.
   *
   * Target of the event.
   * @type {Object|undefined}
   */
  this.target = opt_target;

  /**
   * Object that had the listener attached.
   * @type {Object|undefined}
   */
  this.currentTarget = this.target;

  /**
   * Whether to cancel the event in internal capture/bubble processing for IE.
   * @type {boolean}
   * @public
   * @suppress {underscore|visibility} Technically public, but referencing this
   *     outside this package is strongly discouraged.
   */
  this.propagationStopped_ = false;

  /**
   * Whether the default action has been prevented.
   * This is a property to match the W3C specification at
   * {@link http://www.w3.org/TR/DOM-Level-3-Events/
   * #events-event-type-defaultPrevented}.
   * Must be treated as read-only outside the class.
   * @type {boolean}
   */
  this.defaultPrevented = false;

  /**
   * Return value for in internal capture/bubble processing for IE.
   * @type {boolean}
   * @public
   * @suppress {underscore|visibility} Technically public, but referencing this
   *     outside this package is strongly discouraged.
   */
  this.returnValue_ = true;
};


/**
 * For backwards compatibility (goog.events.Event used to inherit
 * goog.Disposable).
 * @deprecated Events don't need to be disposed.
 */
goog.events.Event.prototype.disposeInternal = function() {
};


/**
 * For backwards compatibility (goog.events.Event used to inherit
 * goog.Disposable).
 * @deprecated Events don't need to be disposed.
 */
goog.events.Event.prototype.dispose = function() {
};


/**
 * Stops event propagation.
 */
goog.events.Event.prototype.stopPropagation = function() {
  this.propagationStopped_ = true;
};


/**
 * Prevents the default action, for example a link redirecting to a url.
 */
goog.events.Event.prototype.preventDefault = function() {
  this.defaultPrevented = true;
  this.returnValue_ = false;
};


/**
 * Stops the propagation of the event. It is equivalent to
 * {@code e.stopPropagation()}, but can be used as the callback argument of
 * {@link goog.events.listen} without declaring another function.
 * @param {!goog.events.Event} e An event.
 */
goog.events.Event.stopPropagation = function(e) {
  e.stopPropagation();
};


/**
 * Prevents the default action. It is equivalent to
 * {@code e.preventDefault()}, but can be used as the callback argument of
 * {@link goog.events.listen} without declaring another function.
 * @param {!goog.events.Event} e An event.
 */
goog.events.Event.preventDefault = function(e) {
  e.preventDefault();
};

// Copyright 2009 The Closure Library Authors. All Rights Reserved.
//
// Licensed under the Apache License, Version 2.0 (the "License");
// you may not use this file except in compliance with the License.
// You may obtain a copy of the License at
//
//      http://www.apache.org/licenses/LICENSE-2.0
//
// Unless required by applicable law or agreed to in writing, software
// distributed under the License is distributed on an "AS-IS" BASIS,
// WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
// See the License for the specific language governing permissions and
// limitations under the License.

/**
 * @fileoverview Provides a base class for custom Error objects such that the
 * stack is correctly maintained.
 *
 * You should never need to throw goog.debug.Error(msg) directly, Error(msg) is
 * sufficient.
 *
 */

goog.provide('goog.debug.Error');



/**
 * Base class for custom error objects.
 * @param {*=} opt_msg The message associated with the error.
 * @constructor
 * @extends {Error}
 */
goog.debug.Error = function(opt_msg) {

  // Attempt to ensure there is a stack trace.
  if (Error.captureStackTrace) {
    Error.captureStackTrace(this, goog.debug.Error);
  } else {
    var stack = new Error().stack;
    if (stack) {
      this.stack = stack;
    }
  }

  if (opt_msg) {
    this.message = String(opt_msg);
  }
};
goog.inherits(goog.debug.Error, Error);


/** @override */
goog.debug.Error.prototype.name = 'CustomError';

// Copyright 2006 The Closure Library Authors. All Rights Reserved.
//
// Licensed under the Apache License, Version 2.0 (the "License");
// you may not use this file except in compliance with the License.
// You may obtain a copy of the License at
//
//      http://www.apache.org/licenses/LICENSE-2.0
//
// Unless required by applicable law or agreed to in writing, software
// distributed under the License is distributed on an "AS-IS" BASIS,
// WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
// See the License for the specific language governing permissions and
// limitations under the License.

/**
 * @fileoverview Definition of goog.dom.NodeType.
 */

goog.provide('goog.dom.NodeType');


/**
 * Constants for the nodeType attribute in the Node interface.
 *
 * These constants match those specified in the Node interface. These are
 * usually present on the Node object in recent browsers, but not in older
 * browsers (specifically, early IEs) and thus are given here.
 *
 * In some browsers (early IEs), these are not defined on the Node object,
 * so they are provided here.
 *
 * See http://www.w3.org/TR/DOM-Level-2-Core/core.html#ID-1950641247
 * @enum {number}
 */
goog.dom.NodeType = {
  ELEMENT: 1,
  ATTRIBUTE: 2,
  TEXT: 3,
  CDATA_SECTION: 4,
  ENTITY_REFERENCE: 5,
  ENTITY: 6,
  PROCESSING_INSTRUCTION: 7,
  COMMENT: 8,
  DOCUMENT: 9,
  DOCUMENT_TYPE: 10,
  DOCUMENT_FRAGMENT: 11,
  NOTATION: 12
};

// Copyright 2006 The Closure Library Authors. All Rights Reserved.
//
// Licensed under the Apache License, Version 2.0 (the "License");
// you may not use this file except in compliance with the License.
// You may obtain a copy of the License at
//
//      http://www.apache.org/licenses/LICENSE-2.0
//
// Unless required by applicable law or agreed to in writing, software
// distributed under the License is distributed on an "AS-IS" BASIS,
// WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
// See the License for the specific language governing permissions and
// limitations under the License.

/**
 * @fileoverview Utilities for string manipulation.
 * @author arv@google.com (Erik Arvidsson)
 */


/**
 * Namespace for string utilities
 */
goog.provide('goog.string');
goog.provide('goog.string.Unicode');


/**
 * @define {boolean} Enables HTML escaping of lowercase letter "e" which helps
 * with detection of double-escaping as this letter is frequently used.
 */
goog.define('goog.string.DETECT_DOUBLE_ESCAPING', false);


/**
 * Common Unicode string characters.
 * @enum {string}
 */
goog.string.Unicode = {
  NBSP: '\xa0'
};


/**
 * Fast prefix-checker.
 * @param {string} str The string to check.
 * @param {string} prefix A string to look for at the start of {@code str}.
 * @return {boolean} True if {@code str} begins with {@code prefix}.
 */
goog.string.startsWith = function(str, prefix) {
  return str.lastIndexOf(prefix, 0) == 0;
};


/**
 * Fast suffix-checker.
 * @param {string} str The string to check.
 * @param {string} suffix A string to look for at the end of {@code str}.
 * @return {boolean} True if {@code str} ends with {@code suffix}.
 */
goog.string.endsWith = function(str, suffix) {
  var l = str.length - suffix.length;
  return l >= 0 && str.indexOf(suffix, l) == l;
};


/**
 * Case-insensitive prefix-checker.
 * @param {string} str The string to check.
 * @param {string} prefix  A string to look for at the end of {@code str}.
 * @return {boolean} True if {@code str} begins with {@code prefix} (ignoring
 *     case).
 */
goog.string.caseInsensitiveStartsWith = function(str, prefix) {
  return goog.string.caseInsensitiveCompare(
      prefix, str.substr(0, prefix.length)) == 0;
};


/**
 * Case-insensitive suffix-checker.
 * @param {string} str The string to check.
 * @param {string} suffix A string to look for at the end of {@code str}.
 * @return {boolean} True if {@code str} ends with {@code suffix} (ignoring
 *     case).
 */
goog.string.caseInsensitiveEndsWith = function(str, suffix) {
  return goog.string.caseInsensitiveCompare(
      suffix, str.substr(str.length - suffix.length, suffix.length)) == 0;
};


/**
 * Case-insensitive equality checker.
 * @param {string} str1 First string to check.
 * @param {string} str2 Second string to check.
 * @return {boolean} True if {@code str1} and {@code str2} are the same string,
 *     ignoring case.
 */
goog.string.caseInsensitiveEquals = function(str1, str2) {
  return str1.toLowerCase() == str2.toLowerCase();
};


/**
 * Does simple python-style string substitution.
 * subs("foo%s hot%s", "bar", "dog") becomes "foobar hotdog".
 * @param {string} str The string containing the pattern.
 * @param {...*} var_args The items to substitute into the pattern.
 * @return {string} A copy of {@code str} in which each occurrence of
 *     {@code %s} has been replaced an argument from {@code var_args}.
 */
goog.string.subs = function(str, var_args) {
  var splitParts = str.split('%s');
  var returnString = '';

  var subsArguments = Array.prototype.slice.call(arguments, 1);
  while (subsArguments.length &&
         // Replace up to the last split part. We are inserting in the
         // positions between split parts.
         splitParts.length > 1) {
    returnString += splitParts.shift() + subsArguments.shift();
  }

  return returnString + splitParts.join('%s'); // Join unused '%s'
};


/**
 * Converts multiple whitespace chars (spaces, non-breaking-spaces, new lines
 * and tabs) to a single space, and strips leading and trailing whitespace.
 * @param {string} str Input string.
 * @return {string} A copy of {@code str} with collapsed whitespace.
 */
goog.string.collapseWhitespace = function(str) {
  // Since IE doesn't include non-breaking-space (0xa0) in their \s character
  // class (as required by section 7.2 of the ECMAScript spec), we explicitly
  // include it in the regexp to enforce consistent cross-browser behavior.
  return str.replace(/[\s\xa0]+/g, ' ').replace(/^\s+|\s+$/g, '');
};


/**
 * Checks if a string is empty or contains only whitespaces.
 * @param {string} str The string to check.
 * @return {boolean} True if {@code str} is empty or whitespace only.
 */
goog.string.isEmpty = function(str) {
  // testing length == 0 first is actually slower in all browsers (about the
  // same in Opera).
  // Since IE doesn't include non-breaking-space (0xa0) in their \s character
  // class (as required by section 7.2 of the ECMAScript spec), we explicitly
  // include it in the regexp to enforce consistent cross-browser behavior.
  return /^[\s\xa0]*$/.test(str);
};


/**
 * Checks if a string is null, undefined, empty or contains only whitespaces.
 * @param {*} str The string to check.
 * @return {boolean} True if{@code str} is null, undefined, empty, or
 *     whitespace only.
 */
goog.string.isEmptySafe = function(str) {
  return goog.string.isEmpty(goog.string.makeSafe(str));
};


/**
 * Checks if a string is all breaking whitespace.
 * @param {string} str The string to check.
 * @return {boolean} Whether the string is all breaking whitespace.
 */
goog.string.isBreakingWhitespace = function(str) {
  return !/[^\t\n\r ]/.test(str);
};


/**
 * Checks if a string contains all letters.
 * @param {string} str string to check.
 * @return {boolean} True if {@code str} consists entirely of letters.
 */
goog.string.isAlpha = function(str) {
  return !/[^a-zA-Z]/.test(str);
};


/**
 * Checks if a string contains only numbers.
 * @param {*} str string to check. If not a string, it will be
 *     casted to one.
 * @return {boolean} True if {@code str} is numeric.
 */
goog.string.isNumeric = function(str) {
  return !/[^0-9]/.test(str);
};


/**
 * Checks if a string contains only numbers or letters.
 * @param {string} str string to check.
 * @return {boolean} True if {@code str} is alphanumeric.
 */
goog.string.isAlphaNumeric = function(str) {
  return !/[^a-zA-Z0-9]/.test(str);
};


/**
 * Checks if a character is a space character.
 * @param {string} ch Character to check.
 * @return {boolean} True if {code ch} is a space.
 */
goog.string.isSpace = function(ch) {
  return ch == ' ';
};


/**
 * Checks if a character is a valid unicode character.
 * @param {string} ch Character to check.
 * @return {boolean} True if {code ch} is a valid unicode character.
 */
goog.string.isUnicodeChar = function(ch) {
  return ch.length == 1 && ch >= ' ' && ch <= '~' ||
         ch >= '\u0080' && ch <= '\uFFFD';
};


/**
 * Takes a string and replaces newlines with a space. Multiple lines are
 * replaced with a single space.
 * @param {string} str The string from which to strip newlines.
 * @return {string} A copy of {@code str} stripped of newlines.
 */
goog.string.stripNewlines = function(str) {
  return str.replace(/(\r\n|\r|\n)+/g, ' ');
};


/**
 * Replaces Windows and Mac new lines with unix style: \r or \r\n with \n.
 * @param {string} str The string to in which to canonicalize newlines.
 * @return {string} {@code str} A copy of {@code} with canonicalized newlines.
 */
goog.string.canonicalizeNewlines = function(str) {
  return str.replace(/(\r\n|\r|\n)/g, '\n');
};


/**
 * Normalizes whitespace in a string, replacing all whitespace chars with
 * a space.
 * @param {string} str The string in which to normalize whitespace.
 * @return {string} A copy of {@code str} with all whitespace normalized.
 */
goog.string.normalizeWhitespace = function(str) {
  return str.replace(/\xa0|\s/g, ' ');
};


/**
 * Normalizes spaces in a string, replacing all consecutive spaces and tabs
 * with a single space. Replaces non-breaking space with a space.
 * @param {string} str The string in which to normalize spaces.
 * @return {string} A copy of {@code str} with all consecutive spaces and tabs
 *    replaced with a single space.
 */
goog.string.normalizeSpaces = function(str) {
  return str.replace(/\xa0|[ \t]+/g, ' ');
};


/**
 * Removes the breaking spaces from the left and right of the string and
 * collapses the sequences of breaking spaces in the middle into single spaces.
 * The original and the result strings render the same way in HTML.
 * @param {string} str A string in which to collapse spaces.
 * @return {string} Copy of the string with normalized breaking spaces.
 */
goog.string.collapseBreakingSpaces = function(str) {
  return str.replace(/[\t\r\n ]+/g, ' ').replace(
      /^[\t\r\n ]+|[\t\r\n ]+$/g, '');
};


/**
 * Trims white spaces to the left and right of a string.
 * @param {string} str The string to trim.
 * @return {string} A trimmed copy of {@code str}.
 */
goog.string.trim = (goog.TRUSTED_SITE && String.prototype.trim) ?
    function(str) {
      return str.trim();
    } :
    function(str) {
      // Since IE doesn't include non-breaking-space (0xa0) in their \s
      // character class (as required by section 7.2 of the ECMAScript spec),
      // we explicitly include it in the regexp to enforce consistent
      // cross-browser behavior.
      return str.replace(/^[\s\xa0]+|[\s\xa0]+$/g, '');
    };


/**
 * Trims whitespaces at the left end of a string.
 * @param {string} str The string to left trim.
 * @return {string} A trimmed copy of {@code str}.
 */
goog.string.trimLeft = function(str) {
  // Since IE doesn't include non-breaking-space (0xa0) in their \s character
  // class (as required by section 7.2 of the ECMAScript spec), we explicitly
  // include it in the regexp to enforce consistent cross-browser behavior.
  return str.replace(/^[\s\xa0]+/, '');
};


/**
 * Trims whitespaces at the right end of a string.
 * @param {string} str The string to right trim.
 * @return {string} A trimmed copy of {@code str}.
 */
goog.string.trimRight = function(str) {
  // Since IE doesn't include non-breaking-space (0xa0) in their \s character
  // class (as required by section 7.2 of the ECMAScript spec), we explicitly
  // include it in the regexp to enforce consistent cross-browser behavior.
  return str.replace(/[\s\xa0]+$/, '');
};


/**
 * A string comparator that ignores case.
 * -1 = str1 less than str2
 *  0 = str1 equals str2
 *  1 = str1 greater than str2
 *
 * @param {string} str1 The string to compare.
 * @param {string} str2 The string to compare {@code str1} to.
 * @return {number} The comparator result, as described above.
 */
goog.string.caseInsensitiveCompare = function(str1, str2) {
  var test1 = String(str1).toLowerCase();
  var test2 = String(str2).toLowerCase();

  if (test1 < test2) {
    return -1;
  } else if (test1 == test2) {
    return 0;
  } else {
    return 1;
  }
};


/**
 * Regular expression used for splitting a string into substrings of fractional
 * numbers, integers, and non-numeric characters.
 * @type {RegExp}
 * @private
 */
goog.string.numerateCompareRegExp_ = /(\.\d+)|(\d+)|(\D+)/g;


/**
 * String comparison function that handles numbers in a way humans might expect.
 * Using this function, the string "File 2.jpg" sorts before "File 10.jpg". The
 * comparison is mostly case-insensitive, though strings that are identical
 * except for case are sorted with the upper-case strings before lower-case.
 *
 * This comparison function is significantly slower (about 500x) than either
 * the default or the case-insensitive compare. It should not be used in
 * time-critical code, but should be fast enough to sort several hundred short
 * strings (like filenames) with a reasonable delay.
 *
 * @param {string} str1 The string to compare in a numerically sensitive way.
 * @param {string} str2 The string to compare {@code str1} to.
 * @return {number} less than 0 if str1 < str2, 0 if str1 == str2, greater than
 *     0 if str1 > str2.
 */
goog.string.numerateCompare = function(str1, str2) {
  if (str1 == str2) {
    return 0;
  }
  if (!str1) {
    return -1;
  }
  if (!str2) {
    return 1;
  }

  // Using match to split the entire string ahead of time turns out to be faster
  // for most inputs than using RegExp.exec or iterating over each character.
  var tokens1 = str1.toLowerCase().match(goog.string.numerateCompareRegExp_);
  var tokens2 = str2.toLowerCase().match(goog.string.numerateCompareRegExp_);

  var count = Math.min(tokens1.length, tokens2.length);

  for (var i = 0; i < count; i++) {
    var a = tokens1[i];
    var b = tokens2[i];

    // Compare pairs of tokens, returning if one token sorts before the other.
    if (a != b) {

      // Only if both tokens are integers is a special comparison required.
      // Decimal numbers are sorted as strings (e.g., '.09' < '.1').
      var num1 = parseInt(a, 10);
      if (!isNaN(num1)) {
        var num2 = parseInt(b, 10);
        if (!isNaN(num2) && num1 - num2) {
          return num1 - num2;
        }
      }
      return a < b ? -1 : 1;
    }
  }

  // If one string is a substring of the other, the shorter string sorts first.
  if (tokens1.length != tokens2.length) {
    return tokens1.length - tokens2.length;
  }

  // The two strings must be equivalent except for case (perfect equality is
  // tested at the head of the function.) Revert to default ASCII-betical string
  // comparison to stablize the sort.
  return str1 < str2 ? -1 : 1;
};


/**
 * URL-encodes a string
 * @param {*} str The string to url-encode.
 * @return {string} An encoded copy of {@code str} that is safe for urls.
 *     Note that '#', ':', and other characters used to delimit portions
 *     of URLs *will* be encoded.
 */
goog.string.urlEncode = function(str) {
  return encodeURIComponent(String(str));
};


/**
 * URL-decodes the string. We need to specially handle '+'s because
 * the javascript library doesn't convert them to spaces.
 * @param {string} str The string to url decode.
 * @return {string} The decoded {@code str}.
 */
goog.string.urlDecode = function(str) {
  return decodeURIComponent(str.replace(/\+/g, ' '));
};


/**
 * Converts \n to <br>s or <br />s.
 * @param {string} str The string in which to convert newlines.
 * @param {boolean=} opt_xml Whether to use XML compatible tags.
 * @return {string} A copy of {@code str} with converted newlines.
 */
goog.string.newLineToBr = function(str, opt_xml) {
  return str.replace(/(\r\n|\r|\n)/g, opt_xml ? '<br />' : '<br>');
};


/**
 * Escapes double quote '"' and single quote '\'' characters in addition to
 * '&', '<', and '>' so that a string can be included in an HTML tag attribute
 * value within double or single quotes.
 *
 * It should be noted that > doesn't need to be escaped for the HTML or XML to
 * be valid, but it has been decided to escape it for consistency with other
 * implementations.
 *
 * With goog.string.DETECT_DOUBLE_ESCAPING, this function escapes also the
 * lowercase letter "e".
 *
 * NOTE(user):
 * HtmlEscape is often called during the generation of large blocks of HTML.
 * Using statics for the regular expressions and strings is an optimization
 * that can more than half the amount of time IE spends in this function for
 * large apps, since strings and regexes both contribute to GC allocations.
 *
 * Testing for the presence of a character before escaping increases the number
 * of function calls, but actually provides a speed increase for the average
 * case -- since the average case often doesn't require the escaping of all 4
 * characters and indexOf() is much cheaper than replace().
 * The worst case does suffer slightly from the additional calls, therefore the
 * opt_isLikelyToContainHtmlChars option has been included for situations
 * where all 4 HTML entities are very likely to be present and need escaping.
 *
 * Some benchmarks (times tended to fluctuate +-0.05ms):
 *                                     FireFox                     IE6
 * (no chars / average (mix of cases) / all 4 chars)
 * no checks                     0.13 / 0.22 / 0.22         0.23 / 0.53 / 0.80
 * indexOf                       0.08 / 0.17 / 0.26         0.22 / 0.54 / 0.84
 * indexOf + re test             0.07 / 0.17 / 0.28         0.19 / 0.50 / 0.85
 *
 * An additional advantage of checking if replace actually needs to be called
 * is a reduction in the number of object allocations, so as the size of the
 * application grows the difference between the various methods would increase.
 *
 * @param {string} str string to be escaped.
 * @param {boolean=} opt_isLikelyToContainHtmlChars Don't perform a check to see
 *     if the character needs replacing - use this option if you expect each of
 *     the characters to appear often. Leave false if you expect few html
 *     characters to occur in your strings, such as if you are escaping HTML.
 * @return {string} An escaped copy of {@code str}.
 */
goog.string.htmlEscape = function(str, opt_isLikelyToContainHtmlChars) {

  if (opt_isLikelyToContainHtmlChars) {
    str = str.replace(goog.string.AMP_RE_, '&amp;')
          .replace(goog.string.LT_RE_, '&lt;')
          .replace(goog.string.GT_RE_, '&gt;')
          .replace(goog.string.QUOT_RE_, '&quot;')
          .replace(goog.string.SINGLE_QUOTE_RE_, '&#39;')
          .replace(goog.string.NULL_RE_, '&#0;');
    if (goog.string.DETECT_DOUBLE_ESCAPING) {
      str = str.replace(goog.string.E_RE_, '&#101;');
    }
    return str;

  } else {
    // quick test helps in the case when there are no chars to replace, in
    // worst case this makes barely a difference to the time taken
    if (!goog.string.ALL_RE_.test(str)) return str;

    // str.indexOf is faster than regex.test in this case
    if (str.indexOf('&') != -1) {
      str = str.replace(goog.string.AMP_RE_, '&amp;');
    }
    if (str.indexOf('<') != -1) {
      str = str.replace(goog.string.LT_RE_, '&lt;');
    }
    if (str.indexOf('>') != -1) {
      str = str.replace(goog.string.GT_RE_, '&gt;');
    }
    if (str.indexOf('"') != -1) {
      str = str.replace(goog.string.QUOT_RE_, '&quot;');
    }
    if (str.indexOf('\'') != -1) {
      str = str.replace(goog.string.SINGLE_QUOTE_RE_, '&#39;');
    }
    if (str.indexOf('\x00') != -1) {
      str = str.replace(goog.string.NULL_RE_, '&#0;');
    }
    if (goog.string.DETECT_DOUBLE_ESCAPING && str.indexOf('e') != -1) {
      str = str.replace(goog.string.E_RE_, '&#101;');
    }
    return str;
  }
};


/**
 * Regular expression that matches an ampersand, for use in escaping.
 * @const {!RegExp}
 * @private
 */
goog.string.AMP_RE_ = /&/g;


/**
 * Regular expression that matches a less than sign, for use in escaping.
 * @const {!RegExp}
 * @private
 */
goog.string.LT_RE_ = /</g;


/**
 * Regular expression that matches a greater than sign, for use in escaping.
 * @const {!RegExp}
 * @private
 */
goog.string.GT_RE_ = />/g;


/**
 * Regular expression that matches a double quote, for use in escaping.
 * @const {!RegExp}
 * @private
 */
goog.string.QUOT_RE_ = /"/g;


/**
 * Regular expression that matches a single quote, for use in escaping.
 * @const {!RegExp}
 * @private
 */
goog.string.SINGLE_QUOTE_RE_ = /'/g;


/**
 * Regular expression that matches null character, for use in escaping.
 * @const {!RegExp}
 * @private
 */
goog.string.NULL_RE_ = /\x00/g;


/**
 * Regular expression that matches a lowercase letter "e", for use in escaping.
 * @const {!RegExp}
 * @private
 */
goog.string.E_RE_ = /e/g;


/**
 * Regular expression that matches any character that needs to be escaped.
 * @const {!RegExp}
 * @private
 */
goog.string.ALL_RE_ = (goog.string.DETECT_DOUBLE_ESCAPING ?
    /[\x00&<>"'e]/ :
    /[\x00&<>"']/);


/**
 * Unescapes an HTML string.
 *
 * @param {string} str The string to unescape.
 * @return {string} An unescaped copy of {@code str}.
 */
goog.string.unescapeEntities = function(str) {
  if (goog.string.contains(str, '&')) {
    // We are careful not to use a DOM if we do not have one. We use the []
    // notation so that the JSCompiler will not complain about these objects and
    // fields in the case where we have no DOM.
    if ('document' in goog.global) {
      return goog.string.unescapeEntitiesUsingDom_(str);
    } else {
      // Fall back on pure XML entities
      return goog.string.unescapePureXmlEntities_(str);
    }
  }
  return str;
};


/**
 * Unescapes a HTML string using the provided document.
 *
 * @param {string} str The string to unescape.
 * @param {!Document} document A document to use in escaping the string.
 * @return {string} An unescaped copy of {@code str}.
 */
goog.string.unescapeEntitiesWithDocument = function(str, document) {
  if (goog.string.contains(str, '&')) {
    return goog.string.unescapeEntitiesUsingDom_(str, document);
  }
  return str;
};


/**
 * Unescapes an HTML string using a DOM to resolve non-XML, non-numeric
 * entities. This function is XSS-safe and whitespace-preserving.
 * @private
 * @param {string} str The string to unescape.
 * @param {Document=} opt_document An optional document to use for creating
 *     elements. If this is not specified then the default window.document
 *     will be used.
 * @return {string} The unescaped {@code str} string.
 */
goog.string.unescapeEntitiesUsingDom_ = function(str, opt_document) {
  var seen = {'&amp;': '&', '&lt;': '<', '&gt;': '>', '&quot;': '"'};
  var div;
  if (opt_document) {
    div = opt_document.createElement('div');
  } else {
    div = goog.global.document.createElement('div');
  }
  // Match as many valid entity characters as possible. If the actual entity
  // happens to be shorter, it will still work as innerHTML will return the
  // trailing characters unchanged. Since the entity characters do not include
  // open angle bracket, there is no chance of XSS from the innerHTML use.
  // Since no whitespace is passed to innerHTML, whitespace is preserved.
  return str.replace(goog.string.HTML_ENTITY_PATTERN_, function(s, entity) {
    // Check for cached entity.
    var value = seen[s];
    if (value) {
      return value;
    }
    // Check for numeric entity.
    if (entity.charAt(0) == '#') {
      // Prefix with 0 so that hex entities (e.g. &#x10) parse as hex numbers.
      var n = Number('0' + entity.substr(1));
      if (!isNaN(n)) {
        value = String.fromCharCode(n);
      }
    }
    // Fall back to innerHTML otherwise.
    if (!value) {
      // Append a non-entity character to avoid a bug in Webkit that parses
      // an invalid entity at the end of innerHTML text as the empty string.
      div.innerHTML = s + ' ';
      // Then remove the trailing character from the result.
      value = div.firstChild.nodeValue.slice(0, -1);
    }
    // Cache and return.
    return seen[s] = value;
  });
};


/**
 * Unescapes XML entities.
 * @private
 * @param {string} str The string to unescape.
 * @return {string} An unescaped copy of {@code str}.
 */
goog.string.unescapePureXmlEntities_ = function(str) {
  return str.replace(/&([^;]+);/g, function(s, entity) {
    switch (entity) {
      case 'amp':
        return '&';
      case 'lt':
        return '<';
      case 'gt':
        return '>';
      case 'quot':
        return '"';
      default:
        if (entity.charAt(0) == '#') {
          // Prefix with 0 so that hex entities (e.g. &#x10) parse as hex.
          var n = Number('0' + entity.substr(1));
          if (!isNaN(n)) {
            return String.fromCharCode(n);
          }
        }
        // For invalid entities we just return the entity
        return s;
    }
  });
};


/**
 * Regular expression that matches an HTML entity.
 * See also HTML5: Tokenization / Tokenizing character references.
 * @private
 * @type {!RegExp}
 */
goog.string.HTML_ENTITY_PATTERN_ = /&([^;\s<&]+);?/g;


/**
 * Do escaping of whitespace to preserve spatial formatting. We use character
 * entity #160 to make it safer for xml.
 * @param {string} str The string in which to escape whitespace.
 * @param {boolean=} opt_xml Whether to use XML compatible tags.
 * @return {string} An escaped copy of {@code str}.
 */
goog.string.whitespaceEscape = function(str, opt_xml) {
  // This doesn't use goog.string.preserveSpaces for backwards compatibility.
  return goog.string.newLineToBr(str.replace(/  /g, ' &#160;'), opt_xml);
};


/**
 * Preserve spaces that would be otherwise collapsed in HTML by replacing them
 * with non-breaking space Unicode characters.
 * @param {string} str The string in which to preserve whitespace.
 * @return {string} A copy of {@code str} with preserved whitespace.
 */
goog.string.preserveSpaces = function(str) {
  return str.replace(/(^|[\n ]) /g, '$1' + goog.string.Unicode.NBSP);
};


/**
 * Strip quote characters around a string.  The second argument is a string of
 * characters to treat as quotes.  This can be a single character or a string of
 * multiple character and in that case each of those are treated as possible
 * quote characters. For example:
 *
 * <pre>
 * goog.string.stripQuotes('"abc"', '"`') --> 'abc'
 * goog.string.stripQuotes('`abc`', '"`') --> 'abc'
 * </pre>
 *
 * @param {string} str The string to strip.
 * @param {string} quoteChars The quote characters to strip.
 * @return {string} A copy of {@code str} without the quotes.
 */
goog.string.stripQuotes = function(str, quoteChars) {
  var length = quoteChars.length;
  for (var i = 0; i < length; i++) {
    var quoteChar = length == 1 ? quoteChars : quoteChars.charAt(i);
    if (str.charAt(0) == quoteChar && str.charAt(str.length - 1) == quoteChar) {
      return str.substring(1, str.length - 1);
    }
  }
  return str;
};


/**
 * Truncates a string to a certain length and adds '...' if necessary.  The
 * length also accounts for the ellipsis, so a maximum length of 10 and a string
 * 'Hello World!' produces 'Hello W...'.
 * @param {string} str The string to truncate.
 * @param {number} chars Max number of characters.
 * @param {boolean=} opt_protectEscapedCharacters Whether to protect escaped
 *     characters from being cut off in the middle.
 * @return {string} The truncated {@code str} string.
 */
goog.string.truncate = function(str, chars, opt_protectEscapedCharacters) {
  if (opt_protectEscapedCharacters) {
    str = goog.string.unescapeEntities(str);
  }

  if (str.length > chars) {
    str = str.substring(0, chars - 3) + '...';
  }

  if (opt_protectEscapedCharacters) {
    str = goog.string.htmlEscape(str);
  }

  return str;
};


/**
 * Truncate a string in the middle, adding "..." if necessary,
 * and favoring the beginning of the string.
 * @param {string} str The string to truncate the middle of.
 * @param {number} chars Max number of characters.
 * @param {boolean=} opt_protectEscapedCharacters Whether to protect escaped
 *     characters from being cutoff in the middle.
 * @param {number=} opt_trailingChars Optional number of trailing characters to
 *     leave at the end of the string, instead of truncating as close to the
 *     middle as possible.
 * @return {string} A truncated copy of {@code str}.
 */
goog.string.truncateMiddle = function(str, chars,
    opt_protectEscapedCharacters, opt_trailingChars) {
  if (opt_protectEscapedCharacters) {
    str = goog.string.unescapeEntities(str);
  }

  if (opt_trailingChars && str.length > chars) {
    if (opt_trailingChars > chars) {
      opt_trailingChars = chars;
    }
    var endPoint = str.length - opt_trailingChars;
    var startPoint = chars - opt_trailingChars;
    str = str.substring(0, startPoint) + '...' + str.substring(endPoint);
  } else if (str.length > chars) {
    // Favor the beginning of the string:
    var half = Math.floor(chars / 2);
    var endPos = str.length - half;
    half += chars % 2;
    str = str.substring(0, half) + '...' + str.substring(endPos);
  }

  if (opt_protectEscapedCharacters) {
    str = goog.string.htmlEscape(str);
  }

  return str;
};


/**
 * Special chars that need to be escaped for goog.string.quote.
 * @private
 * @type {Object}
 */
goog.string.specialEscapeChars_ = {
  '\0': '\\0',
  '\b': '\\b',
  '\f': '\\f',
  '\n': '\\n',
  '\r': '\\r',
  '\t': '\\t',
  '\x0B': '\\x0B', // '\v' is not supported in JScript
  '"': '\\"',
  '\\': '\\\\'
};


/**
 * Character mappings used internally for goog.string.escapeChar.
 * @private
 * @type {Object}
 */
goog.string.jsEscapeCache_ = {
  '\'': '\\\''
};


/**
 * Encloses a string in double quotes and escapes characters so that the
 * string is a valid JS string.
 * @param {string} s The string to quote.
 * @return {string} A copy of {@code s} surrounded by double quotes.
 */
goog.string.quote = function(s) {
  s = String(s);
  if (s.quote) {
    return s.quote();
  } else {
    var sb = ['"'];
    for (var i = 0; i < s.length; i++) {
      var ch = s.charAt(i);
      var cc = ch.charCodeAt(0);
      sb[i + 1] = goog.string.specialEscapeChars_[ch] ||
          ((cc > 31 && cc < 127) ? ch : goog.string.escapeChar(ch));
    }
    sb.push('"');
    return sb.join('');
  }
};


/**
 * Takes a string and returns the escaped string for that character.
 * @param {string} str The string to escape.
 * @return {string} An escaped string representing {@code str}.
 */
goog.string.escapeString = function(str) {
  var sb = [];
  for (var i = 0; i < str.length; i++) {
    sb[i] = goog.string.escapeChar(str.charAt(i));
  }
  return sb.join('');
};


/**
 * Takes a character and returns the escaped string for that character. For
 * example escapeChar(String.fromCharCode(15)) -> "\\x0E".
 * @param {string} c The character to escape.
 * @return {string} An escaped string representing {@code c}.
 */
goog.string.escapeChar = function(c) {
  if (c in goog.string.jsEscapeCache_) {
    return goog.string.jsEscapeCache_[c];
  }

  if (c in goog.string.specialEscapeChars_) {
    return goog.string.jsEscapeCache_[c] = goog.string.specialEscapeChars_[c];
  }

  var rv = c;
  var cc = c.charCodeAt(0);
  if (cc > 31 && cc < 127) {
    rv = c;
  } else {
    // tab is 9 but handled above
    if (cc < 256) {
      rv = '\\x';
      if (cc < 16 || cc > 256) {
        rv += '0';
      }
    } else {
      rv = '\\u';
      if (cc < 4096) { // \u1000
        rv += '0';
      }
    }
    rv += cc.toString(16).toUpperCase();
  }

  return goog.string.jsEscapeCache_[c] = rv;
};


/**
 * Determines whether a string contains a substring.
 * @param {string} str The string to search.
 * @param {string} subString The substring to search for.
 * @return {boolean} Whether {@code str} contains {@code subString}.
 */
goog.string.contains = function(str, subString) {
  return str.indexOf(subString) != -1;
};


/**
 * Determines whether a string contains a substring, ignoring case.
 * @param {string} str The string to search.
 * @param {string} subString The substring to search for.
 * @return {boolean} Whether {@code str} contains {@code subString}.
 */
goog.string.caseInsensitiveContains = function(str, subString) {
  return goog.string.contains(str.toLowerCase(), subString.toLowerCase());
};


/**
 * Returns the non-overlapping occurrences of ss in s.
 * If either s or ss evalutes to false, then returns zero.
 * @param {string} s The string to look in.
 * @param {string} ss The string to look for.
 * @return {number} Number of occurrences of ss in s.
 */
goog.string.countOf = function(s, ss) {
  return s && ss ? s.split(ss).length - 1 : 0;
};


/**
 * Removes a substring of a specified length at a specific
 * index in a string.
 * @param {string} s The base string from which to remove.
 * @param {number} index The index at which to remove the substring.
 * @param {number} stringLength The length of the substring to remove.
 * @return {string} A copy of {@code s} with the substring removed or the full
 *     string if nothing is removed or the input is invalid.
 */
goog.string.removeAt = function(s, index, stringLength) {
  var resultStr = s;
  // If the index is greater or equal to 0 then remove substring
  if (index >= 0 && index < s.length && stringLength > 0) {
    resultStr = s.substr(0, index) +
        s.substr(index + stringLength, s.length - index - stringLength);
  }
  return resultStr;
};


/**
 *  Removes the first occurrence of a substring from a string.
 *  @param {string} s The base string from which to remove.
 *  @param {string} ss The string to remove.
 *  @return {string} A copy of {@code s} with {@code ss} removed or the full
 *      string if nothing is removed.
 */
goog.string.remove = function(s, ss) {
  var re = new RegExp(goog.string.regExpEscape(ss), '');
  return s.replace(re, '');
};


/**
 *  Removes all occurrences of a substring from a string.
 *  @param {string} s The base string from which to remove.
 *  @param {string} ss The string to remove.
 *  @return {string} A copy of {@code s} with {@code ss} removed or the full
 *      string if nothing is removed.
 */
goog.string.removeAll = function(s, ss) {
  var re = new RegExp(goog.string.regExpEscape(ss), 'g');
  return s.replace(re, '');
};


/**
 * Escapes characters in the string that are not safe to use in a RegExp.
 * @param {*} s The string to escape. If not a string, it will be casted
 *     to one.
 * @return {string} A RegExp safe, escaped copy of {@code s}.
 */
goog.string.regExpEscape = function(s) {
  return String(s).replace(/([-()\[\]{}+?*.$\^|,:#<!\\])/g, '\\$1').
      replace(/\x08/g, '\\x08');
};


/**
 * Repeats a string n times.
 * @param {string} string The string to repeat.
 * @param {number} length The number of times to repeat.
 * @return {string} A string containing {@code length} repetitions of
 *     {@code string}.
 */
goog.string.repeat = function(string, length) {
  return new Array(length + 1).join(string);
};


/**
 * Pads number to given length and optionally rounds it to a given precision.
 * For example:
 * <pre>padNumber(1.25, 2, 3) -> '01.250'
 * padNumber(1.25, 2) -> '01.25'
 * padNumber(1.25, 2, 1) -> '01.3'
 * padNumber(1.25, 0) -> '1.25'</pre>
 *
 * @param {number} num The number to pad.
 * @param {number} length The desired length.
 * @param {number=} opt_precision The desired precision.
 * @return {string} {@code num} as a string with the given options.
 */
goog.string.padNumber = function(num, length, opt_precision) {
  var s = goog.isDef(opt_precision) ? num.toFixed(opt_precision) : String(num);
  var index = s.indexOf('.');
  if (index == -1) {
    index = s.length;
  }
  return goog.string.repeat('0', Math.max(0, length - index)) + s;
};


/**
 * Returns a string representation of the given object, with
 * null and undefined being returned as the empty string.
 *
 * @param {*} obj The object to convert.
 * @return {string} A string representation of the {@code obj}.
 */
goog.string.makeSafe = function(obj) {
  return obj == null ? '' : String(obj);
};


/**
 * Concatenates string expressions. This is useful
 * since some browsers are very inefficient when it comes to using plus to
 * concat strings. Be careful when using null and undefined here since
 * these will not be included in the result. If you need to represent these
 * be sure to cast the argument to a String first.
 * For example:
 * <pre>buildString('a', 'b', 'c', 'd') -> 'abcd'
 * buildString(null, undefined) -> ''
 * </pre>
 * @param {...*} var_args A list of strings to concatenate. If not a string,
 *     it will be casted to one.
 * @return {string} The concatenation of {@code var_args}.
 */
goog.string.buildString = function(var_args) {
  return Array.prototype.join.call(arguments, '');
};


/**
 * Returns a string with at least 64-bits of randomness.
 *
 * Doesn't trust Javascript's random function entirely. Uses a combination of
 * random and current timestamp, and then encodes the string in base-36 to
 * make it shorter.
 *
 * @return {string} A random string, e.g. sn1s7vb4gcic.
 */
goog.string.getRandomString = function() {
  var x = 2147483648;
  return Math.floor(Math.random() * x).toString(36) +
         Math.abs(Math.floor(Math.random() * x) ^ goog.now()).toString(36);
};


/**
 * Compares two version numbers.
 *
 * @param {string|number} version1 Version of first item.
 * @param {string|number} version2 Version of second item.
 *
 * @return {number}  1 if {@code version1} is higher.
 *                   0 if arguments are equal.
 *                  -1 if {@code version2} is higher.
 */
goog.string.compareVersions = function(version1, version2) {
  var order = 0;
  // Trim leading and trailing whitespace and split the versions into
  // subversions.
  var v1Subs = goog.string.trim(String(version1)).split('.');
  var v2Subs = goog.string.trim(String(version2)).split('.');
  var subCount = Math.max(v1Subs.length, v2Subs.length);

  // Iterate over the subversions, as long as they appear to be equivalent.
  for (var subIdx = 0; order == 0 && subIdx < subCount; subIdx++) {
    var v1Sub = v1Subs[subIdx] || '';
    var v2Sub = v2Subs[subIdx] || '';

    // Split the subversions into pairs of numbers and qualifiers (like 'b').
    // Two different RegExp objects are needed because they are both using
    // the 'g' flag.
    var v1CompParser = new RegExp('(\\d*)(\\D*)', 'g');
    var v2CompParser = new RegExp('(\\d*)(\\D*)', 'g');
    do {
      var v1Comp = v1CompParser.exec(v1Sub) || ['', '', ''];
      var v2Comp = v2CompParser.exec(v2Sub) || ['', '', ''];
      // Break if there are no more matches.
      if (v1Comp[0].length == 0 && v2Comp[0].length == 0) {
        break;
      }

      // Parse the numeric part of the subversion. A missing number is
      // equivalent to 0.
      var v1CompNum = v1Comp[1].length == 0 ? 0 : parseInt(v1Comp[1], 10);
      var v2CompNum = v2Comp[1].length == 0 ? 0 : parseInt(v2Comp[1], 10);

      // Compare the subversion components. The number has the highest
      // precedence. Next, if the numbers are equal, a subversion without any
      // qualifier is always higher than a subversion with any qualifier. Next,
      // the qualifiers are compared as strings.
      order = goog.string.compareElements_(v1CompNum, v2CompNum) ||
          goog.string.compareElements_(v1Comp[2].length == 0,
              v2Comp[2].length == 0) ||
          goog.string.compareElements_(v1Comp[2], v2Comp[2]);
      // Stop as soon as an inequality is discovered.
    } while (order == 0);
  }

  return order;
};


/**
 * Compares elements of a version number.
 *
 * @param {string|number|boolean} left An element from a version number.
 * @param {string|number|boolean} right An element from a version number.
 *
 * @return {number}  1 if {@code left} is higher.
 *                   0 if arguments are equal.
 *                  -1 if {@code right} is higher.
 * @private
 */
goog.string.compareElements_ = function(left, right) {
  if (left < right) {
    return -1;
  } else if (left > right) {
    return 1;
  }
  return 0;
};


/**
 * Maximum value of #goog.string.hashCode, exclusive. 2^32.
 * @type {number}
 * @private
 */
goog.string.HASHCODE_MAX_ = 0x100000000;


/**
 * String hash function similar to java.lang.String.hashCode().
 * The hash code for a string is computed as
 * s[0] * 31 ^ (n - 1) + s[1] * 31 ^ (n - 2) + ... + s[n - 1],
 * where s[i] is the ith character of the string and n is the length of
 * the string. We mod the result to make it between 0 (inclusive) and 2^32
 * (exclusive).
 * @param {string} str A string.
 * @return {number} Hash value for {@code str}, between 0 (inclusive) and 2^32
 *  (exclusive). The empty string returns 0.
 */
goog.string.hashCode = function(str) {
  var result = 0;
  for (var i = 0; i < str.length; ++i) {
    result = 31 * result + str.charCodeAt(i);
    // Normalize to 4 byte range, 0 ... 2^32.
    result %= goog.string.HASHCODE_MAX_;
  }
  return result;
};


/**
 * The most recent unique ID. |0 is equivalent to Math.floor in this case.
 * @type {number}
 * @private
 */
goog.string.uniqueStringCounter_ = Math.random() * 0x80000000 | 0;


/**
 * Generates and returns a string which is unique in the current document.
 * This is useful, for example, to create unique IDs for DOM elements.
 * @return {string} A unique id.
 */
goog.string.createUniqueString = function() {
  return 'goog_' + goog.string.uniqueStringCounter_++;
};


/**
 * Converts the supplied string to a number, which may be Infinity or NaN.
 * This function strips whitespace: (toNumber(' 123') === 123)
 * This function accepts scientific notation: (toNumber('1e1') === 10)
 *
 * This is better than Javascript's built-in conversions because, sadly:
 *     (Number(' ') === 0) and (parseFloat('123a') === 123)
 *
 * @param {string} str The string to convert.
 * @return {number} The number the supplied string represents, or NaN.
 */
goog.string.toNumber = function(str) {
  var num = Number(str);
  if (num == 0 && goog.string.isEmpty(str)) {
    return NaN;
  }
  return num;
};


/**
 * Returns whether the given string is lower camel case (e.g. "isFooBar").
 *
 * Note that this assumes the string is entirely letters.
 * @see http://en.wikipedia.org/wiki/CamelCase#Variations_and_synonyms
 *
 * @param {string} str String to test.
 * @return {boolean} Whether the string is lower camel case.
 */
goog.string.isLowerCamelCase = function(str) {
  return /^[a-z]+([A-Z][a-z]*)*$/.test(str);
};


/**
 * Returns whether the given string is upper camel case (e.g. "FooBarBaz").
 *
 * Note that this assumes the string is entirely letters.
 * @see http://en.wikipedia.org/wiki/CamelCase#Variations_and_synonyms
 *
 * @param {string} str String to test.
 * @return {boolean} Whether the string is upper camel case.
 */
goog.string.isUpperCamelCase = function(str) {
  return /^([A-Z][a-z]*)+$/.test(str);
};


/**
 * Converts a string from selector-case to camelCase (e.g. from
 * "multi-part-string" to "multiPartString"), useful for converting
 * CSS selectors and HTML dataset keys to their equivalent JS properties.
 * @param {string} str The string in selector-case form.
 * @return {string} The string in camelCase form.
 */
goog.string.toCamelCase = function(str) {
  return String(str).replace(/\-([a-z])/g, function(all, match) {
    return match.toUpperCase();
  });
};


/**
 * Converts a string from camelCase to selector-case (e.g. from
 * "multiPartString" to "multi-part-string"), useful for converting JS
 * style and dataset properties to equivalent CSS selectors and HTML keys.
 * @param {string} str The string in camelCase form.
 * @return {string} The string in selector-case form.
 */
goog.string.toSelectorCase = function(str) {
  return String(str).replace(/([A-Z])/g, '-$1').toLowerCase();
};


/**
 * Converts a string into TitleCase. First character of the string is always
 * capitalized in addition to the first letter of every subsequent word.
 * Words are delimited by one or more whitespaces by default. Custom delimiters
 * can optionally be specified to replace the default, which doesn't preserve
 * whitespace delimiters and instead must be explicitly included if needed.
 *
 * Default delimiter => " ":
 *    goog.string.toTitleCase('oneTwoThree')    => 'OneTwoThree'
 *    goog.string.toTitleCase('one two three')  => 'One Two Three'
 *    goog.string.toTitleCase('  one   two   ') => '  One   Two   '
 *    goog.string.toTitleCase('one_two_three')  => 'One_two_three'
 *    goog.string.toTitleCase('one-two-three')  => 'One-two-three'
 *
 * Custom delimiter => "_-.":
 *    goog.string.toTitleCase('oneTwoThree', '_-.')       => 'OneTwoThree'
 *    goog.string.toTitleCase('one two three', '_-.')     => 'One two three'
 *    goog.string.toTitleCase('  one   two   ', '_-.')    => '  one   two   '
 *    goog.string.toTitleCase('one_two_three', '_-.')     => 'One_Two_Three'
 *    goog.string.toTitleCase('one-two-three', '_-.')     => 'One-Two-Three'
 *    goog.string.toTitleCase('one...two...three', '_-.') => 'One...Two...Three'
 *    goog.string.toTitleCase('one. two. three', '_-.')   => 'One. two. three'
 *    goog.string.toTitleCase('one-two.three', '_-.')     => 'One-Two.Three'
 *
 * @param {string} str String value in camelCase form.
 * @param {string=} opt_delimiters Custom delimiter character set used to
 *      distinguish words in the string value. Each character represents a
 *      single delimiter. When provided, default whitespace delimiter is
 *      overridden and must be explicitly included if needed.
 * @return {string} String value in TitleCase form.
 */
goog.string.toTitleCase = function(str, opt_delimiters) {
  var delimiters = goog.isString(opt_delimiters) ?
      goog.string.regExpEscape(opt_delimiters) : '\\s';

  // For IE8, we need to prevent using an empty character set. Otherwise,
  // incorrect matching will occur.
  delimiters = delimiters ? '|[' + delimiters + ']+' : '';

  var regexp = new RegExp('(^' + delimiters + ')([a-z])', 'g');
  return str.replace(regexp, function(all, p1, p2) {
    return p1 + p2.toUpperCase();
  });
};


/**
 * Parse a string in decimal or hexidecimal ('0xFFFF') form.
 *
 * To parse a particular radix, please use parseInt(string, radix) directly. See
 * https://developer.mozilla.org/en/JavaScript/Reference/Global_Objects/parseInt
 *
 * This is a wrapper for the built-in parseInt function that will only parse
 * numbers as base 10 or base 16.  Some JS implementations assume strings
 * starting with "0" are intended to be octal. ES3 allowed but discouraged
 * this behavior. ES5 forbids it.  This function emulates the ES5 behavior.
 *
 * For more information, see Mozilla JS Reference: http://goo.gl/8RiFj
 *
 * @param {string|number|null|undefined} value The value to be parsed.
 * @return {number} The number, parsed. If the string failed to parse, this
 *     will be NaN.
 */
goog.string.parseInt = function(value) {
  // Force finite numbers to strings.
  if (isFinite(value)) {
    value = String(value);
  }

  if (goog.isString(value)) {
    // If the string starts with '0x' or '-0x', parse as hex.
    return /^\s*-?0x/i.test(value) ?
        parseInt(value, 16) : parseInt(value, 10);
  }

  return NaN;
};


/**
 * Splits a string on a separator a limited number of times.
 *
 * This implementation is more similar to Python or Java, where the limit
 * parameter specifies the maximum number of splits rather than truncating
 * the number of results.
 *
 * See http://docs.python.org/2/library/stdtypes.html#str.split
 * See JavaDoc: http://goo.gl/F2AsY
 * See Mozilla reference: http://goo.gl/dZdZs
 *
 * @param {string} str String to split.
 * @param {string} separator The separator.
 * @param {number} limit The limit to the number of splits. The resulting array
 *     will have a maximum length of limit+1.  Negative numbers are the same
 *     as zero.
 * @return {!Array.<string>} The string, split.
 */

goog.string.splitLimit = function(str, separator, limit) {
  var parts = str.split(separator);
  var returnVal = [];

  // Only continue doing this while we haven't hit the limit and we have
  // parts left.
  while (limit > 0 && parts.length) {
    returnVal.push(parts.shift());
    limit--;
  }

  // If there are remaining parts, append them to the end.
  if (parts.length) {
    returnVal.push(parts.join(separator));
  }

  return returnVal;
};

// Copyright 2008 The Closure Library Authors. All Rights Reserved.
//
// Licensed under the Apache License, Version 2.0 (the "License");
// you may not use this file except in compliance with the License.
// You may obtain a copy of the License at
//
//      http://www.apache.org/licenses/LICENSE-2.0
//
// Unless required by applicable law or agreed to in writing, software
// distributed under the License is distributed on an "AS-IS" BASIS,
// WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
// See the License for the specific language governing permissions and
// limitations under the License.

/**
 * @fileoverview Utilities to check the preconditions, postconditions and
 * invariants runtime.
 *
 * Methods in this package should be given special treatment by the compiler
 * for type-inference. For example, <code>goog.asserts.assert(foo)</code>
 * will restrict <code>foo</code> to a truthy value.
 *
 * The compiler has an option to disable asserts. So code like:
 * <code>
 * var x = goog.asserts.assert(foo()); goog.asserts.assert(bar());
 * </code>
 * will be transformed into:
 * <code>
 * var x = foo();
 * </code>
 * The compiler will leave in foo() (because its return value is used),
 * but it will remove bar() because it assumes it does not have side-effects.
 *
 * @author agrieve@google.com (Andrew Grieve)
 */

goog.provide('goog.asserts');
goog.provide('goog.asserts.AssertionError');

goog.require('goog.debug.Error');
goog.require('goog.dom.NodeType');
goog.require('goog.string');


/**
 * @define {boolean} Whether to strip out asserts or to leave them in.
 */
goog.define('goog.asserts.ENABLE_ASSERTS', goog.DEBUG);



/**
 * Error object for failed assertions.
 * @param {string} messagePattern The pattern that was used to form message.
 * @param {!Array.<*>} messageArgs The items to substitute into the pattern.
 * @constructor
 * @extends {goog.debug.Error}
 * @final
 */
goog.asserts.AssertionError = function(messagePattern, messageArgs) {
  messageArgs.unshift(messagePattern);
  goog.debug.Error.call(this, goog.string.subs.apply(null, messageArgs));
  // Remove the messagePattern afterwards to avoid permenantly modifying the
  // passed in array.
  messageArgs.shift();

  /**
   * The message pattern used to format the error message. Error handlers can
   * use this to uniquely identify the assertion.
   * @type {string}
   */
  this.messagePattern = messagePattern;
};
goog.inherits(goog.asserts.AssertionError, goog.debug.Error);


/** @override */
goog.asserts.AssertionError.prototype.name = 'AssertionError';


/**
 * The default error handler.
 * @param {!goog.asserts.AssertionError} e The exception to be handled.
 */
goog.asserts.DEFAULT_ERROR_HANDLER = function(e) { throw e; };


/**
 * The handler responsible for throwing or logging assertion errors.
 * @private {function(!goog.asserts.AssertionError)}
 */
goog.asserts.errorHandler_ = goog.asserts.DEFAULT_ERROR_HANDLER;


/**
 * Throws an exception with the given message and "Assertion failed" prefixed
 * onto it.
 * @param {string} defaultMessage The message to use if givenMessage is empty.
 * @param {Array.<*>} defaultArgs The substitution arguments for defaultMessage.
 * @param {string|undefined} givenMessage Message supplied by the caller.
 * @param {Array.<*>} givenArgs The substitution arguments for givenMessage.
 * @throws {goog.asserts.AssertionError} When the value is not a number.
 * @private
 */
goog.asserts.doAssertFailure_ =
    function(defaultMessage, defaultArgs, givenMessage, givenArgs) {
  var message = 'Assertion failed';
  if (givenMessage) {
    message += ': ' + givenMessage;
    var args = givenArgs;
  } else if (defaultMessage) {
    message += ': ' + defaultMessage;
    args = defaultArgs;
  }
  // The '' + works around an Opera 10 bug in the unit tests. Without it,
  // a stack trace is added to var message above. With this, a stack trace is
  // not added until this line (it causes the extra garbage to be added after
  // the assertion message instead of in the middle of it).
  var e = new goog.asserts.AssertionError('' + message, args || []);
  goog.asserts.errorHandler_(e);
};


/**
 * Sets a custom error handler that can be used to customize the behavior of
 * assertion failures, for example by turning all assertion failures into log
 * messages.
 * @param {function(goog.asserts.AssertionError)} errorHandler
 */
goog.asserts.setErrorHandler = function(errorHandler) {
  if (goog.asserts.ENABLE_ASSERTS) {
    goog.asserts.errorHandler_ = errorHandler;
  }
};


/**
 * Checks if the condition evaluates to true if goog.asserts.ENABLE_ASSERTS is
 * true.
 * @template T
 * @param {T} condition The condition to check.
 * @param {string=} opt_message Error message in case of failure.
 * @param {...*} var_args The items to substitute into the failure message.
 * @return {!T} The value of the condition.
 * @throws {goog.asserts.AssertionError} When the condition evaluates to false.
 */
goog.asserts.assert = function(condition, opt_message, var_args) {
  if (goog.asserts.ENABLE_ASSERTS && !condition) {
    goog.asserts.doAssertFailure_('', null, opt_message,
        Array.prototype.slice.call(arguments, 2));
  }
  return condition;
};


/**
 * Fails if goog.asserts.ENABLE_ASSERTS is true. This function is useful in case
 * when we want to add a check in the unreachable area like switch-case
 * statement:
 *
 * <pre>
 *  switch(type) {
 *    case FOO: doSomething(); break;
 *    case BAR: doSomethingElse(); break;
 *    default: goog.assert.fail('Unrecognized type: ' + type);
 *      // We have only 2 types - "default:" section is unreachable code.
 *  }
 * </pre>
 *
 * @param {string=} opt_message Error message in case of failure.
 * @param {...*} var_args The items to substitute into the failure message.
 * @throws {goog.asserts.AssertionError} Failure.
 */
goog.asserts.fail = function(opt_message, var_args) {
  if (goog.asserts.ENABLE_ASSERTS) {
    goog.asserts.errorHandler_(new goog.asserts.AssertionError(
        'Failure' + (opt_message ? ': ' + opt_message : ''),
        Array.prototype.slice.call(arguments, 1)));
  }
};


/**
 * Checks if the value is a number if goog.asserts.ENABLE_ASSERTS is true.
 * @param {*} value The value to check.
 * @param {string=} opt_message Error message in case of failure.
 * @param {...*} var_args The items to substitute into the failure message.
 * @return {number} The value, guaranteed to be a number when asserts enabled.
 * @throws {goog.asserts.AssertionError} When the value is not a number.
 */
goog.asserts.assertNumber = function(value, opt_message, var_args) {
  if (goog.asserts.ENABLE_ASSERTS && !goog.isNumber(value)) {
    goog.asserts.doAssertFailure_('Expected number but got %s: %s.',
        [goog.typeOf(value), value], opt_message,
        Array.prototype.slice.call(arguments, 2));
  }
  return /** @type {number} */ (value);
};


/**
 * Checks if the value is a string if goog.asserts.ENABLE_ASSERTS is true.
 * @param {*} value The value to check.
 * @param {string=} opt_message Error message in case of failure.
 * @param {...*} var_args The items to substitute into the failure message.
 * @return {string} The value, guaranteed to be a string when asserts enabled.
 * @throws {goog.asserts.AssertionError} When the value is not a string.
 */
goog.asserts.assertString = function(value, opt_message, var_args) {
  if (goog.asserts.ENABLE_ASSERTS && !goog.isString(value)) {
    goog.asserts.doAssertFailure_('Expected string but got %s: %s.',
        [goog.typeOf(value), value], opt_message,
        Array.prototype.slice.call(arguments, 2));
  }
  return /** @type {string} */ (value);
};


/**
 * Checks if the value is a function if goog.asserts.ENABLE_ASSERTS is true.
 * @param {*} value The value to check.
 * @param {string=} opt_message Error message in case of failure.
 * @param {...*} var_args The items to substitute into the failure message.
 * @return {!Function} The value, guaranteed to be a function when asserts
 *     enabled.
 * @throws {goog.asserts.AssertionError} When the value is not a function.
 */
goog.asserts.assertFunction = function(value, opt_message, var_args) {
  if (goog.asserts.ENABLE_ASSERTS && !goog.isFunction(value)) {
    goog.asserts.doAssertFailure_('Expected function but got %s: %s.',
        [goog.typeOf(value), value], opt_message,
        Array.prototype.slice.call(arguments, 2));
  }
  return /** @type {!Function} */ (value);
};


/**
 * Checks if the value is an Object if goog.asserts.ENABLE_ASSERTS is true.
 * @param {*} value The value to check.
 * @param {string=} opt_message Error message in case of failure.
 * @param {...*} var_args The items to substitute into the failure message.
 * @return {!Object} The value, guaranteed to be a non-null object.
 * @throws {goog.asserts.AssertionError} When the value is not an object.
 */
goog.asserts.assertObject = function(value, opt_message, var_args) {
  if (goog.asserts.ENABLE_ASSERTS && !goog.isObject(value)) {
    goog.asserts.doAssertFailure_('Expected object but got %s: %s.',
        [goog.typeOf(value), value],
        opt_message, Array.prototype.slice.call(arguments, 2));
  }
  return /** @type {!Object} */ (value);
};


/**
 * Checks if the value is an Array if goog.asserts.ENABLE_ASSERTS is true.
 * @param {*} value The value to check.
 * @param {string=} opt_message Error message in case of failure.
 * @param {...*} var_args The items to substitute into the failure message.
 * @return {!Array.<?>} The value, guaranteed to be a non-null array.
 * @throws {goog.asserts.AssertionError} When the value is not an array.
 */
goog.asserts.assertArray = function(value, opt_message, var_args) {
  if (goog.asserts.ENABLE_ASSERTS && !goog.isArray(value)) {
    goog.asserts.doAssertFailure_('Expected array but got %s: %s.',
        [goog.typeOf(value), value], opt_message,
        Array.prototype.slice.call(arguments, 2));
  }
  return /** @type {!Array.<?>} */ (value);
};


/**
 * Checks if the value is a boolean if goog.asserts.ENABLE_ASSERTS is true.
 * @param {*} value The value to check.
 * @param {string=} opt_message Error message in case of failure.
 * @param {...*} var_args The items to substitute into the failure message.
 * @return {boolean} The value, guaranteed to be a boolean when asserts are
 *     enabled.
 * @throws {goog.asserts.AssertionError} When the value is not a boolean.
 */
goog.asserts.assertBoolean = function(value, opt_message, var_args) {
  if (goog.asserts.ENABLE_ASSERTS && !goog.isBoolean(value)) {
    goog.asserts.doAssertFailure_('Expected boolean but got %s: %s.',
        [goog.typeOf(value), value], opt_message,
        Array.prototype.slice.call(arguments, 2));
  }
  return /** @type {boolean} */ (value);
};


/**
 * Checks if the value is a DOM Element if goog.asserts.ENABLE_ASSERTS is true.
 * @param {*} value The value to check.
 * @param {string=} opt_message Error message in case of failure.
 * @param {...*} var_args The items to substitute into the failure message.
 * @return {!Element} The value, likely to be a DOM Element when asserts are
 *     enabled.
 * @throws {goog.asserts.AssertionError} When the value is not a boolean.
 */
goog.asserts.assertElement = function(value, opt_message, var_args) {
  if (goog.asserts.ENABLE_ASSERTS && (!goog.isObject(value) ||
      value.nodeType != goog.dom.NodeType.ELEMENT)) {
    goog.asserts.doAssertFailure_('Expected Element but got %s: %s.',
        [goog.typeOf(value), value], opt_message,
        Array.prototype.slice.call(arguments, 2));
  }
  return /** @type {!Element} */ (value);
};


/**
 * Checks if the value is an instance of the user-defined type if
 * goog.asserts.ENABLE_ASSERTS is true.
 *
 * The compiler may tighten the type returned by this function.
 *
 * @param {*} value The value to check.
 * @param {function(new: T, ...)} type A user-defined constructor.
 * @param {string=} opt_message Error message in case of failure.
 * @param {...*} var_args The items to substitute into the failure message.
 * @throws {goog.asserts.AssertionError} When the value is not an instance of
 *     type.
 * @return {!T}
 * @template T
 */
goog.asserts.assertInstanceof = function(value, type, opt_message, var_args) {
  if (goog.asserts.ENABLE_ASSERTS && !(value instanceof type)) {
    goog.asserts.doAssertFailure_('instanceof check failed.', null,
        opt_message, Array.prototype.slice.call(arguments, 3));
  }
  return value;
};


/**
 * Checks that no enumerable keys are present in Object.prototype. Such keys
 * would break most code that use {@code for (var ... in ...)} loops.
 */
goog.asserts.assertObjectPrototypeIsIntact = function() {
  for (var key in Object.prototype) {
    goog.asserts.fail(key + ' should not be enumerable in Object.prototype.');
  }
};

// Copyright 2006 The Closure Library Authors. All Rights Reserved.
//
// Licensed under the Apache License, Version 2.0 (the "License");
// you may not use this file except in compliance with the License.
// You may obtain a copy of the License at
//
//      http://www.apache.org/licenses/LICENSE-2.0
//
// Unless required by applicable law or agreed to in writing, software
// distributed under the License is distributed on an "AS-IS" BASIS,
// WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
// See the License for the specific language governing permissions and
// limitations under the License.

/**
 * @fileoverview Utilities for manipulating arrays.
 *
 * @author arv@google.com (Erik Arvidsson)
 */


goog.provide('goog.array');
goog.provide('goog.array.ArrayLike');

goog.require('goog.asserts');


/**
 * @define {boolean} NATIVE_ARRAY_PROTOTYPES indicates whether the code should
 * rely on Array.prototype functions, if available.
 *
 * The Array.prototype functions can be defined by external libraries like
 * Prototype and setting this flag to false forces closure to use its own
 * goog.array implementation.
 *
 * If your javascript can be loaded by a third party site and you are wary about
 * relying on the prototype functions, specify
 * "--define goog.NATIVE_ARRAY_PROTOTYPES=false" to the JSCompiler.
 *
 * Setting goog.TRUSTED_SITE to false will automatically set
 * NATIVE_ARRAY_PROTOTYPES to false.
 */
goog.define('goog.NATIVE_ARRAY_PROTOTYPES', goog.TRUSTED_SITE);


/**
 * @define {boolean} If true, JSCompiler will use the native implementation of
 * array functions where appropriate (e.g., {@code Array#filter}) and remove the
 * unused pure JS implementation.
 */
goog.define('goog.array.ASSUME_NATIVE_FUNCTIONS', false);


/**
 * @typedef {Array|NodeList|Arguments|{length: number}}
 */
goog.array.ArrayLike;


/**
 * Returns the last element in an array without removing it.
 * Same as goog.array.last.
 * @param {Array.<T>|goog.array.ArrayLike} array The array.
 * @return {T} Last item in array.
 * @template T
 */
goog.array.peek = function(array) {
  return array[array.length - 1];
};


/**
 * Returns the last element in an array without removing it.
 * Same as goog.array.peek.
 * @param {Array.<T>|goog.array.ArrayLike} array The array.
 * @return {T} Last item in array.
 * @template T
 */
goog.array.last = goog.array.peek;


/**
 * Reference to the original {@code Array.prototype}.
 * @private
 */
goog.array.ARRAY_PROTOTYPE_ = Array.prototype;


// NOTE(arv): Since most of the array functions are generic it allows you to
// pass an array-like object. Strings have a length and are considered array-
// like. However, the 'in' operator does not work on strings so we cannot just
// use the array path even if the browser supports indexing into strings. We
// therefore end up splitting the string.


/**
 * Returns the index of the first element of an array with a specified value, or
 * -1 if the element is not present in the array.
 *
 * See {@link http://tinyurl.com/developer-mozilla-org-array-indexof}
 *
 * @param {Array.<T>|goog.array.ArrayLike} arr The array to be searched.
 * @param {T} obj The object for which we are searching.
 * @param {number=} opt_fromIndex The index at which to start the search. If
 *     omitted the search starts at index 0.
 * @return {number} The index of the first matching array element.
 * @template T
 */
goog.array.indexOf = goog.NATIVE_ARRAY_PROTOTYPES &&
                     (goog.array.ASSUME_NATIVE_FUNCTIONS ||
                      goog.array.ARRAY_PROTOTYPE_.indexOf) ?
    function(arr, obj, opt_fromIndex) {
      goog.asserts.assert(arr.length != null);

      return goog.array.ARRAY_PROTOTYPE_.indexOf.call(arr, obj, opt_fromIndex);
    } :
    function(arr, obj, opt_fromIndex) {
      var fromIndex = opt_fromIndex == null ?
          0 : (opt_fromIndex < 0 ?
               Math.max(0, arr.length + opt_fromIndex) : opt_fromIndex);

      if (goog.isString(arr)) {
        // Array.prototype.indexOf uses === so only strings should be found.
        if (!goog.isString(obj) || obj.length != 1) {
          return -1;
        }
        return arr.indexOf(obj, fromIndex);
      }

      for (var i = fromIndex; i < arr.length; i++) {
        if (i in arr && arr[i] === obj)
          return i;
      }
      return -1;
    };


/**
 * Returns the index of the last element of an array with a specified value, or
 * -1 if the element is not present in the array.
 *
 * See {@link http://tinyurl.com/developer-mozilla-org-array-lastindexof}
 *
 * @param {!Array.<T>|!goog.array.ArrayLike} arr The array to be searched.
 * @param {T} obj The object for which we are searching.
 * @param {?number=} opt_fromIndex The index at which to start the search. If
 *     omitted the search starts at the end of the array.
 * @return {number} The index of the last matching array element.
 * @template T
 */
goog.array.lastIndexOf = goog.NATIVE_ARRAY_PROTOTYPES &&
                         (goog.array.ASSUME_NATIVE_FUNCTIONS ||
                          goog.array.ARRAY_PROTOTYPE_.lastIndexOf) ?
    function(arr, obj, opt_fromIndex) {
      goog.asserts.assert(arr.length != null);

      // Firefox treats undefined and null as 0 in the fromIndex argument which
      // leads it to always return -1
      var fromIndex = opt_fromIndex == null ? arr.length - 1 : opt_fromIndex;
      return goog.array.ARRAY_PROTOTYPE_.lastIndexOf.call(arr, obj, fromIndex);
    } :
    function(arr, obj, opt_fromIndex) {
      var fromIndex = opt_fromIndex == null ? arr.length - 1 : opt_fromIndex;

      if (fromIndex < 0) {
        fromIndex = Math.max(0, arr.length + fromIndex);
      }

      if (goog.isString(arr)) {
        // Array.prototype.lastIndexOf uses === so only strings should be found.
        if (!goog.isString(obj) || obj.length != 1) {
          return -1;
        }
        return arr.lastIndexOf(obj, fromIndex);
      }

      for (var i = fromIndex; i >= 0; i--) {
        if (i in arr && arr[i] === obj)
          return i;
      }
      return -1;
    };


/**
 * Calls a function for each element in an array. Skips holes in the array.
 * See {@link http://tinyurl.com/developer-mozilla-org-array-foreach}
 *
 * @param {Array.<T>|goog.array.ArrayLike} arr Array or array like object over
 *     which to iterate.
 * @param {?function(this: S, T, number, ?): ?} f The function to call for every
 *     element. This function takes 3 arguments (the element, the index and the
 *     array). The return value is ignored.
 * @param {S=} opt_obj The object to be used as the value of 'this' within f.
 * @template T,S
 */
goog.array.forEach = goog.NATIVE_ARRAY_PROTOTYPES &&
                     (goog.array.ASSUME_NATIVE_FUNCTIONS ||
                      goog.array.ARRAY_PROTOTYPE_.forEach) ?
    function(arr, f, opt_obj) {
      goog.asserts.assert(arr.length != null);

      goog.array.ARRAY_PROTOTYPE_.forEach.call(arr, f, opt_obj);
    } :
    function(arr, f, opt_obj) {
      var l = arr.length;  // must be fixed during loop... see docs
      var arr2 = goog.isString(arr) ? arr.split('') : arr;
      for (var i = 0; i < l; i++) {
        if (i in arr2) {
          f.call(opt_obj, arr2[i], i, arr);
        }
      }
    };


/**
 * Calls a function for each element in an array, starting from the last
 * element rather than the first.
 *
 * @param {Array.<T>|goog.array.ArrayLike} arr Array or array
 *     like object over which to iterate.
 * @param {?function(this: S, T, number, ?): ?} f The function to call for every
 *     element. This function
 *     takes 3 arguments (the element, the index and the array). The return
 *     value is ignored.
 * @param {S=} opt_obj The object to be used as the value of 'this'
 *     within f.
 * @template T,S
 */
goog.array.forEachRight = function(arr, f, opt_obj) {
  var l = arr.length;  // must be fixed during loop... see docs
  var arr2 = goog.isString(arr) ? arr.split('') : arr;
  for (var i = l - 1; i >= 0; --i) {
    if (i in arr2) {
      f.call(opt_obj, arr2[i], i, arr);
    }
  }
};


/**
 * Calls a function for each element in an array, and if the function returns
 * true adds the element to a new array.
 *
 * See {@link http://tinyurl.com/developer-mozilla-org-array-filter}
 *
 * @param {Array.<T>|goog.array.ArrayLike} arr Array or array
 *     like object over which to iterate.
 * @param {?function(this:S, T, number, ?):boolean} f The function to call for
 *     every element. This function
 *     takes 3 arguments (the element, the index and the array) and must
 *     return a Boolean. If the return value is true the element is added to the
 *     result array. If it is false the element is not included.
 * @param {S=} opt_obj The object to be used as the value of 'this'
 *     within f.
 * @return {!Array.<T>} a new array in which only elements that passed the test
 *     are present.
 * @template T,S
 */
goog.array.filter = goog.NATIVE_ARRAY_PROTOTYPES &&
                    (goog.array.ASSUME_NATIVE_FUNCTIONS ||
                     goog.array.ARRAY_PROTOTYPE_.filter) ?
    function(arr, f, opt_obj) {
      goog.asserts.assert(arr.length != null);

      return goog.array.ARRAY_PROTOTYPE_.filter.call(arr, f, opt_obj);
    } :
    function(arr, f, opt_obj) {
      var l = arr.length;  // must be fixed during loop... see docs
      var res = [];
      var resLength = 0;
      var arr2 = goog.isString(arr) ? arr.split('') : arr;
      for (var i = 0; i < l; i++) {
        if (i in arr2) {
          var val = arr2[i];  // in case f mutates arr2
          if (f.call(opt_obj, val, i, arr)) {
            res[resLength++] = val;
          }
        }
      }
      return res;
    };


/**
 * Calls a function for each element in an array and inserts the result into a
 * new array.
 *
 * See {@link http://tinyurl.com/developer-mozilla-org-array-map}
 *
 * @param {Array.<VALUE>|goog.array.ArrayLike} arr Array or array like object
 *     over which to iterate.
 * @param {function(this:THIS, VALUE, number, ?): RESULT} f The function to call
 *     for every element. This function takes 3 arguments (the element,
 *     the index and the array) and should return something. The result will be
 *     inserted into a new array.
 * @param {THIS=} opt_obj The object to be used as the value of 'this' within f.
 * @return {!Array.<RESULT>} a new array with the results from f.
 * @template THIS, VALUE, RESULT
 */
goog.array.map = goog.NATIVE_ARRAY_PROTOTYPES &&
                 (goog.array.ASSUME_NATIVE_FUNCTIONS ||
                  goog.array.ARRAY_PROTOTYPE_.map) ?
    function(arr, f, opt_obj) {
      goog.asserts.assert(arr.length != null);

      return goog.array.ARRAY_PROTOTYPE_.map.call(arr, f, opt_obj);
    } :
    function(arr, f, opt_obj) {
      var l = arr.length;  // must be fixed during loop... see docs
      var res = new Array(l);
      var arr2 = goog.isString(arr) ? arr.split('') : arr;
      for (var i = 0; i < l; i++) {
        if (i in arr2) {
          res[i] = f.call(opt_obj, arr2[i], i, arr);
        }
      }
      return res;
    };


/**
 * Passes every element of an array into a function and accumulates the result.
 *
 * See {@link http://tinyurl.com/developer-mozilla-org-array-reduce}
 *
 * For example:
 * var a = [1, 2, 3, 4];
 * goog.array.reduce(a, function(r, v, i, arr) {return r + v;}, 0);
 * returns 10
 *
 * @param {Array.<T>|goog.array.ArrayLike} arr Array or array
 *     like object over which to iterate.
 * @param {?function(this:S, R, T, number, ?) : R} f The function to call for
 *     every element. This function
 *     takes 4 arguments (the function's previous result or the initial value,
 *     the value of the current array element, the current array index, and the
 *     array itself)
 *     function(previousValue, currentValue, index, array).
 * @param {?} val The initial value to pass into the function on the first call.
 * @param {S=} opt_obj  The object to be used as the value of 'this'
 *     within f.
 * @return {R} Result of evaluating f repeatedly across the values of the array.
 * @template T,S,R
 */
goog.array.reduce = goog.NATIVE_ARRAY_PROTOTYPES &&
                    (goog.array.ASSUME_NATIVE_FUNCTIONS ||
                     goog.array.ARRAY_PROTOTYPE_.reduce) ?
    function(arr, f, val, opt_obj) {
      goog.asserts.assert(arr.length != null);
      if (opt_obj) {
        f = goog.bind(f, opt_obj);
      }
      return goog.array.ARRAY_PROTOTYPE_.reduce.call(arr, f, val);
    } :
    function(arr, f, val, opt_obj) {
      var rval = val;
      goog.array.forEach(arr, function(val, index) {
        rval = f.call(opt_obj, rval, val, index, arr);
      });
      return rval;
    };


/**
 * Passes every element of an array into a function and accumulates the result,
 * starting from the last element and working towards the first.
 *
 * See {@link http://tinyurl.com/developer-mozilla-org-array-reduceright}
 *
 * For example:
 * var a = ['a', 'b', 'c'];
 * goog.array.reduceRight(a, function(r, v, i, arr) {return r + v;}, '');
 * returns 'cba'
 *
 * @param {Array.<T>|goog.array.ArrayLike} arr Array or array
 *     like object over which to iterate.
 * @param {?function(this:S, R, T, number, ?) : R} f The function to call for
 *     every element. This function
 *     takes 4 arguments (the function's previous result or the initial value,
 *     the value of the current array element, the current array index, and the
 *     array itself)
 *     function(previousValue, currentValue, index, array).
 * @param {?} val The initial value to pass into the function on the first call.
 * @param {S=} opt_obj The object to be used as the value of 'this'
 *     within f.
 * @return {R} Object returned as a result of evaluating f repeatedly across the
 *     values of the array.
 * @template T,S,R
 */
goog.array.reduceRight = goog.NATIVE_ARRAY_PROTOTYPES &&
                         (goog.array.ASSUME_NATIVE_FUNCTIONS ||
                          goog.array.ARRAY_PROTOTYPE_.reduceRight) ?
    function(arr, f, val, opt_obj) {
      goog.asserts.assert(arr.length != null);
      if (opt_obj) {
        f = goog.bind(f, opt_obj);
      }
      return goog.array.ARRAY_PROTOTYPE_.reduceRight.call(arr, f, val);
    } :
    function(arr, f, val, opt_obj) {
      var rval = val;
      goog.array.forEachRight(arr, function(val, index) {
        rval = f.call(opt_obj, rval, val, index, arr);
      });
      return rval;
    };


/**
 * Calls f for each element of an array. If any call returns true, some()
 * returns true (without checking the remaining elements). If all calls
 * return false, some() returns false.
 *
 * See {@link http://tinyurl.com/developer-mozilla-org-array-some}
 *
 * @param {Array.<T>|goog.array.ArrayLike} arr Array or array
 *     like object over which to iterate.
 * @param {?function(this:S, T, number, ?) : boolean} f The function to call for
 *     for every element. This function takes 3 arguments (the element, the
 *     index and the array) and should return a boolean.
 * @param {S=} opt_obj  The object to be used as the value of 'this'
 *     within f.
 * @return {boolean} true if any element passes the test.
 * @template T,S
 */
goog.array.some = goog.NATIVE_ARRAY_PROTOTYPES &&
                  (goog.array.ASSUME_NATIVE_FUNCTIONS ||
                   goog.array.ARRAY_PROTOTYPE_.some) ?
    function(arr, f, opt_obj) {
      goog.asserts.assert(arr.length != null);

      return goog.array.ARRAY_PROTOTYPE_.some.call(arr, f, opt_obj);
    } :
    function(arr, f, opt_obj) {
      var l = arr.length;  // must be fixed during loop... see docs
      var arr2 = goog.isString(arr) ? arr.split('') : arr;
      for (var i = 0; i < l; i++) {
        if (i in arr2 && f.call(opt_obj, arr2[i], i, arr)) {
          return true;
        }
      }
      return false;
    };


/**
 * Call f for each element of an array. If all calls return true, every()
 * returns true. If any call returns false, every() returns false and
 * does not continue to check the remaining elements.
 *
 * See {@link http://tinyurl.com/developer-mozilla-org-array-every}
 *
 * @param {Array.<T>|goog.array.ArrayLike} arr Array or array
 *     like object over which to iterate.
 * @param {?function(this:S, T, number, ?) : boolean} f The function to call for
 *     for every element. This function takes 3 arguments (the element, the
 *     index and the array) and should return a boolean.
 * @param {S=} opt_obj The object to be used as the value of 'this'
 *     within f.
 * @return {boolean} false if any element fails the test.
 * @template T,S
 */
goog.array.every = goog.NATIVE_ARRAY_PROTOTYPES &&
                   (goog.array.ASSUME_NATIVE_FUNCTIONS ||
                    goog.array.ARRAY_PROTOTYPE_.every) ?
    function(arr, f, opt_obj) {
      goog.asserts.assert(arr.length != null);

      return goog.array.ARRAY_PROTOTYPE_.every.call(arr, f, opt_obj);
    } :
    function(arr, f, opt_obj) {
      var l = arr.length;  // must be fixed during loop... see docs
      var arr2 = goog.isString(arr) ? arr.split('') : arr;
      for (var i = 0; i < l; i++) {
        if (i in arr2 && !f.call(opt_obj, arr2[i], i, arr)) {
          return false;
        }
      }
      return true;
    };


/**
 * Counts the array elements that fulfill the predicate, i.e. for which the
 * callback function returns true. Skips holes in the array.
 *
 * @param {!(Array.<T>|goog.array.ArrayLike)} arr Array or array like object
 *     over which to iterate.
 * @param {function(this: S, T, number, ?): boolean} f The function to call for
 *     every element. Takes 3 arguments (the element, the index and the array).
 * @param {S=} opt_obj The object to be used as the value of 'this' within f.
 * @return {number} The number of the matching elements.
 * @template T,S
 */
goog.array.count = function(arr, f, opt_obj) {
  var count = 0;
  goog.array.forEach(arr, function(element, index, arr) {
    if (f.call(opt_obj, element, index, arr)) {
      ++count;
    }
  }, opt_obj);
  return count;
};


/**
 * Search an array for the first element that satisfies a given condition and
 * return that element.
 * @param {Array.<T>|goog.array.ArrayLike} arr Array or array
 *     like object over which to iterate.
 * @param {?function(this:S, T, number, ?) : boolean} f The function to call
 *     for every element. This function takes 3 arguments (the element, the
 *     index and the array) and should return a boolean.
 * @param {S=} opt_obj An optional "this" context for the function.
 * @return {?T} The first array element that passes the test, or null if no
 *     element is found.
 * @template T,S
 */
goog.array.find = function(arr, f, opt_obj) {
  var i = goog.array.findIndex(arr, f, opt_obj);
  return i < 0 ? null : goog.isString(arr) ? arr.charAt(i) : arr[i];
};


/**
 * Search an array for the first element that satisfies a given condition and
 * return its index.
 * @param {Array.<T>|goog.array.ArrayLike} arr Array or array
 *     like object over which to iterate.
 * @param {?function(this:S, T, number, ?) : boolean} f The function to call for
 *     every element. This function
 *     takes 3 arguments (the element, the index and the array) and should
 *     return a boolean.
 * @param {S=} opt_obj An optional "this" context for the function.
 * @return {number} The index of the first array element that passes the test,
 *     or -1 if no element is found.
 * @template T,S
 */
goog.array.findIndex = function(arr, f, opt_obj) {
  var l = arr.length;  // must be fixed during loop... see docs
  var arr2 = goog.isString(arr) ? arr.split('') : arr;
  for (var i = 0; i < l; i++) {
    if (i in arr2 && f.call(opt_obj, arr2[i], i, arr)) {
      return i;
    }
  }
  return -1;
};


/**
 * Search an array (in reverse order) for the last element that satisfies a
 * given condition and return that element.
 * @param {Array.<T>|goog.array.ArrayLike} arr Array or array
 *     like object over which to iterate.
 * @param {?function(this:S, T, number, ?) : boolean} f The function to call
 *     for every element. This function
 *     takes 3 arguments (the element, the index and the array) and should
 *     return a boolean.
 * @param {S=} opt_obj An optional "this" context for the function.
 * @return {?T} The last array element that passes the test, or null if no
 *     element is found.
 * @template T,S
 */
goog.array.findRight = function(arr, f, opt_obj) {
  var i = goog.array.findIndexRight(arr, f, opt_obj);
  return i < 0 ? null : goog.isString(arr) ? arr.charAt(i) : arr[i];
};


/**
 * Search an array (in reverse order) for the last element that satisfies a
 * given condition and return its index.
 * @param {Array.<T>|goog.array.ArrayLike} arr Array or array
 *     like object over which to iterate.
 * @param {?function(this:S, T, number, ?) : boolean} f The function to call
 *     for every element. This function
 *     takes 3 arguments (the element, the index and the array) and should
 *     return a boolean.
 * @param {Object=} opt_obj An optional "this" context for the function.
 * @return {number} The index of the last array element that passes the test,
 *     or -1 if no element is found.
 * @template T,S
 */
goog.array.findIndexRight = function(arr, f, opt_obj) {
  var l = arr.length;  // must be fixed during loop... see docs
  var arr2 = goog.isString(arr) ? arr.split('') : arr;
  for (var i = l - 1; i >= 0; i--) {
    if (i in arr2 && f.call(opt_obj, arr2[i], i, arr)) {
      return i;
    }
  }
  return -1;
};


/**
 * Whether the array contains the given object.
 * @param {goog.array.ArrayLike} arr The array to test for the presence of the
 *     element.
 * @param {*} obj The object for which to test.
 * @return {boolean} true if obj is present.
 */
goog.array.contains = function(arr, obj) {
  return goog.array.indexOf(arr, obj) >= 0;
};


/**
 * Whether the array is empty.
 * @param {goog.array.ArrayLike} arr The array to test.
 * @return {boolean} true if empty.
 */
goog.array.isEmpty = function(arr) {
  return arr.length == 0;
};


/**
 * Clears the array.
 * @param {goog.array.ArrayLike} arr Array or array like object to clear.
 */
goog.array.clear = function(arr) {
  // For non real arrays we don't have the magic length so we delete the
  // indices.
  if (!goog.isArray(arr)) {
    for (var i = arr.length - 1; i >= 0; i--) {
      delete arr[i];
    }
  }
  arr.length = 0;
};


/**
 * Pushes an item into an array, if it's not already in the array.
 * @param {Array.<T>} arr Array into which to insert the item.
 * @param {T} obj Value to add.
 * @template T
 */
goog.array.insert = function(arr, obj) {
  if (!goog.array.contains(arr, obj)) {
    arr.push(obj);
  }
};


/**
 * Inserts an object at the given index of the array.
 * @param {goog.array.ArrayLike} arr The array to modify.
 * @param {*} obj The object to insert.
 * @param {number=} opt_i The index at which to insert the object. If omitted,
 *      treated as 0. A negative index is counted from the end of the array.
 */
goog.array.insertAt = function(arr, obj, opt_i) {
  goog.array.splice(arr, opt_i, 0, obj);
};


/**
 * Inserts at the given index of the array, all elements of another array.
 * @param {goog.array.ArrayLike} arr The array to modify.
 * @param {goog.array.ArrayLike} elementsToAdd The array of elements to add.
 * @param {number=} opt_i The index at which to insert the object. If omitted,
 *      treated as 0. A negative index is counted from the end of the array.
 */
goog.array.insertArrayAt = function(arr, elementsToAdd, opt_i) {
  goog.partial(goog.array.splice, arr, opt_i, 0).apply(null, elementsToAdd);
};


/**
 * Inserts an object into an array before a specified object.
 * @param {Array.<T>} arr The array to modify.
 * @param {T} obj The object to insert.
 * @param {T=} opt_obj2 The object before which obj should be inserted. If obj2
 *     is omitted or not found, obj is inserted at the end of the array.
 * @template T
 */
goog.array.insertBefore = function(arr, obj, opt_obj2) {
  var i;
  if (arguments.length == 2 || (i = goog.array.indexOf(arr, opt_obj2)) < 0) {
    arr.push(obj);
  } else {
    goog.array.insertAt(arr, obj, i);
  }
};


/**
 * Removes the first occurrence of a particular value from an array.
 * @param {Array.<T>|goog.array.ArrayLike} arr Array from which to remove
 *     value.
 * @param {T} obj Object to remove.
 * @return {boolean} True if an element was removed.
 * @template T
 */
goog.array.remove = function(arr, obj) {
  var i = goog.array.indexOf(arr, obj);
  var rv;
  if ((rv = i >= 0)) {
    goog.array.removeAt(arr, i);
  }
  return rv;
};


/**
 * Removes from an array the element at index i
 * @param {goog.array.ArrayLike} arr Array or array like object from which to
 *     remove value.
 * @param {number} i The index to remove.
 * @return {boolean} True if an element was removed.
 */
goog.array.removeAt = function(arr, i) {
  goog.asserts.assert(arr.length != null);

  // use generic form of splice
  // splice returns the removed items and if successful the length of that
  // will be 1
  return goog.array.ARRAY_PROTOTYPE_.splice.call(arr, i, 1).length == 1;
};


/**
 * Removes the first value that satisfies the given condition.
 * @param {Array.<T>|goog.array.ArrayLike} arr Array or array
 *     like object over which to iterate.
 * @param {?function(this:S, T, number, ?) : boolean} f The function to call
 *     for every element. This function
 *     takes 3 arguments (the element, the index and the array) and should
 *     return a boolean.
 * @param {S=} opt_obj An optional "this" context for the function.
 * @return {boolean} True if an element was removed.
 * @template T,S
 */
goog.array.removeIf = function(arr, f, opt_obj) {
  var i = goog.array.findIndex(arr, f, opt_obj);
  if (i >= 0) {
    goog.array.removeAt(arr, i);
    return true;
  }
  return false;
};


/**
 * Removes all values that satisfy the given condition.
 * @param {Array.<T>|goog.array.ArrayLike} arr Array or array
 *     like object over which to iterate.
 * @param {?function(this:S, T, number, ?) : boolean} f The function to call
 *     for every element. This function
 *     takes 3 arguments (the element, the index and the array) and should
 *     return a boolean.
 * @param {S=} opt_obj An optional "this" context for the function.
 * @return {number} The number of items removed
 * @template T,S
 */
goog.array.removeAllIf = function(arr, f, opt_obj) {
  var removedCount = 0;
  goog.array.forEachRight(arr, function(val, index) {
    if (f.call(opt_obj, val, index, arr)) {
      if (goog.array.removeAt(arr, index)) {
        removedCount++;
      }
    }
  });
  return removedCount;
};


/**
 * Returns a new array that is the result of joining the arguments.  If arrays
 * are passed then their items are added, however, if non-arrays are passed they
 * will be added to the return array as is.
 *
 * Note that ArrayLike objects will be added as is, rather than having their
 * items added.
 *
 * goog.array.concat([1, 2], [3, 4]) -> [1, 2, 3, 4]
 * goog.array.concat(0, [1, 2]) -> [0, 1, 2]
 * goog.array.concat([1, 2], null) -> [1, 2, null]
 *
 * There is bug in all current versions of IE (6, 7 and 8) where arrays created
 * in an iframe become corrupted soon (not immediately) after the iframe is
 * destroyed. This is common if loading data via goog.net.IframeIo, for example.
 * This corruption only affects the concat method which will start throwing
 * Catastrophic Errors (#-2147418113).
 *
 * See http://endoflow.com/scratch/corrupted-arrays.html for a test case.
 *
 * Internally goog.array should use this, so that all methods will continue to
 * work on these broken array objects.
 *
 * @param {...*} var_args Items to concatenate.  Arrays will have each item
 *     added, while primitives and objects will be added as is.
 * @return {!Array.<?>} The new resultant array.
 */
goog.array.concat = function(var_args) {
  return goog.array.ARRAY_PROTOTYPE_.concat.apply(
      goog.array.ARRAY_PROTOTYPE_, arguments);
};


/**
 * Returns a new array that contains the contents of all the arrays passed.
 * @param {...!Array.<T>} var_args
 * @return {!Array.<T>}
 * @template T
 */
goog.array.join = function(var_args) {
  return goog.array.ARRAY_PROTOTYPE_.concat.apply(
      goog.array.ARRAY_PROTOTYPE_, arguments);
};


/**
 * Converts an object to an array.
 * @param {Array.<T>|goog.array.ArrayLike} object  The object to convert to an
 *     array.
 * @return {!Array.<T>} The object converted into an array. If object has a
 *     length property, every property indexed with a non-negative number
 *     less than length will be included in the result. If object does not
 *     have a length property, an empty array will be returned.
 * @template T
 */
goog.array.toArray = function(object) {
  var length = object.length;

  // If length is not a number the following it false. This case is kept for
  // backwards compatibility since there are callers that pass objects that are
  // not array like.
  if (length > 0) {
    var rv = new Array(length);
    for (var i = 0; i < length; i++) {
      rv[i] = object[i];
    }
    return rv;
  }
  return [];
};


/**
 * Does a shallow copy of an array.
 * @param {Array.<T>|goog.array.ArrayLike} arr  Array or array-like object to
 *     clone.
 * @return {!Array.<T>} Clone of the input array.
 * @template T
 */
goog.array.clone = goog.array.toArray;


/**
 * Extends an array with another array, element, or "array like" object.
 * This function operates 'in-place', it does not create a new Array.
 *
 * Example:
 * var a = [];
 * goog.array.extend(a, [0, 1]);
 * a; // [0, 1]
 * goog.array.extend(a, 2);
 * a; // [0, 1, 2]
 *
 * @param {Array.<VALUE>} arr1  The array to modify.
 * @param {...(Array.<VALUE>|VALUE)} var_args The elements or arrays of elements
 *     to add to arr1.
 * @template VALUE
 */
goog.array.extend = function(arr1, var_args) {
  for (var i = 1; i < arguments.length; i++) {
    var arr2 = arguments[i];
    // If we have an Array or an Arguments object we can just call push
    // directly.
    var isArrayLike;
    if (goog.isArray(arr2) ||
        // Detect Arguments. ES5 says that the [[Class]] of an Arguments object
        // is "Arguments" but only V8 and JSC/Safari gets this right. We instead
        // detect Arguments by checking for array like and presence of "callee".
        (isArrayLike = goog.isArrayLike(arr2)) &&
            // The getter for callee throws an exception in strict mode
            // according to section 10.6 in ES5 so check for presence instead.
            Object.prototype.hasOwnProperty.call(arr2, 'callee')) {
      arr1.push.apply(arr1, arr2);
    } else if (isArrayLike) {
      // Otherwise loop over arr2 to prevent copying the object.
      var len1 = arr1.length;
      var len2 = arr2.length;
      for (var j = 0; j < len2; j++) {
        arr1[len1 + j] = arr2[j];
      }
    } else {
      arr1.push(arr2);
    }
  }
};


/**
 * Adds or removes elements from an array. This is a generic version of Array
 * splice. This means that it might work on other objects similar to arrays,
 * such as the arguments object.
 *
 * @param {Array.<T>|goog.array.ArrayLike} arr The array to modify.
 * @param {number|undefined} index The index at which to start changing the
 *     array. If not defined, treated as 0.
 * @param {number} howMany How many elements to remove (0 means no removal. A
 *     value below 0 is treated as zero and so is any other non number. Numbers
 *     are floored).
 * @param {...T} var_args Optional, additional elements to insert into the
 *     array.
 * @return {!Array.<T>} the removed elements.
 * @template T
 */
goog.array.splice = function(arr, index, howMany, var_args) {
  goog.asserts.assert(arr.length != null);

  return goog.array.ARRAY_PROTOTYPE_.splice.apply(
      arr, goog.array.slice(arguments, 1));
};


/**
 * Returns a new array from a segment of an array. This is a generic version of
 * Array slice. This means that it might work on other objects similar to
 * arrays, such as the arguments object.
 *
 * @param {Array.<T>|goog.array.ArrayLike} arr The array from
 * which to copy a segment.
 * @param {number} start The index of the first element to copy.
 * @param {number=} opt_end The index after the last element to copy.
 * @return {!Array.<T>} A new array containing the specified segment of the
 *     original array.
 * @template T
 */
goog.array.slice = function(arr, start, opt_end) {
  goog.asserts.assert(arr.length != null);

  // passing 1 arg to slice is not the same as passing 2 where the second is
  // null or undefined (in that case the second argument is treated as 0).
  // we could use slice on the arguments object and then use apply instead of
  // testing the length
  if (arguments.length <= 2) {
    return goog.array.ARRAY_PROTOTYPE_.slice.call(arr, start);
  } else {
    return goog.array.ARRAY_PROTOTYPE_.slice.call(arr, start, opt_end);
  }
};


/**
 * Removes all duplicates from an array (retaining only the first
 * occurrence of each array element).  This function modifies the
 * array in place and doesn't change the order of the non-duplicate items.
 *
 * For objects, duplicates are identified as having the same unique ID as
 * defined by {@link goog.getUid}.
 *
 * Alternatively you can specify a custom hash function that returns a unique
 * value for each item in the array it should consider unique.
 *
 * Runtime: N,
 * Worstcase space: 2N (no dupes)
 *
 * @param {Array.<T>|goog.array.ArrayLike} arr The array from which to remove
 *     duplicates.
 * @param {Array=} opt_rv An optional array in which to return the results,
 *     instead of performing the removal inplace.  If specified, the original
 *     array will remain unchanged.
 * @param {function(T):string=} opt_hashFn An optional function to use to
 *     apply to every item in the array. This function should return a unique
 *     value for each item in the array it should consider unique.
 * @template T
 */
goog.array.removeDuplicates = function(arr, opt_rv, opt_hashFn) {
  var returnArray = opt_rv || arr;
  var defaultHashFn = function(item) {
    // Prefix each type with a single character representing the type to
    // prevent conflicting keys (e.g. true and 'true').
    return goog.isObject(current) ? 'o' + goog.getUid(current) :
        (typeof current).charAt(0) + current;
  };
  var hashFn = opt_hashFn || defaultHashFn;

  var seen = {}, cursorInsert = 0, cursorRead = 0;
  while (cursorRead < arr.length) {
    var current = arr[cursorRead++];
    var key = hashFn(current);
    if (!Object.prototype.hasOwnProperty.call(seen, key)) {
      seen[key] = true;
      returnArray[cursorInsert++] = current;
    }
  }
  returnArray.length = cursorInsert;
};


/**
 * Searches the specified array for the specified target using the binary
 * search algorithm.  If no opt_compareFn is specified, elements are compared
 * using <code>goog.array.defaultCompare</code>, which compares the elements
 * using the built in < and > operators.  This will produce the expected
 * behavior for homogeneous arrays of String(s) and Number(s). The array
 * specified <b>must</b> be sorted in ascending order (as defined by the
 * comparison function).  If the array is not sorted, results are undefined.
 * If the array contains multiple instances of the specified target value, any
 * of these instances may be found.
 *
 * Runtime: O(log n)
 *
 * @param {Array.<VALUE>|goog.array.ArrayLike} arr The array to be searched.
 * @param {TARGET} target The sought value.
 * @param {function(TARGET, VALUE): number=} opt_compareFn Optional comparison
 *     function by which the array is ordered. Should take 2 arguments to
 *     compare, and return a negative number, zero, or a positive number
 *     depending on whether the first argument is less than, equal to, or
 *     greater than the second.
 * @return {number} Lowest index of the target value if found, otherwise
 *     (-(insertion point) - 1). The insertion point is where the value should
 *     be inserted into arr to preserve the sorted property.  Return value >= 0
 *     iff target is found.
 * @template TARGET, VALUE
 */
goog.array.binarySearch = function(arr, target, opt_compareFn) {
  return goog.array.binarySearch_(arr,
      opt_compareFn || goog.array.defaultCompare, false /* isEvaluator */,
      target);
};


/**
 * Selects an index in the specified array using the binary search algorithm.
 * The evaluator receives an element and determines whether the desired index
 * is before, at, or after it.  The evaluator must be consistent (formally,
 * goog.array.map(goog.array.map(arr, evaluator, opt_obj), goog.math.sign)
 * must be monotonically non-increasing).
 *
 * Runtime: O(log n)
 *
 * @param {Array.<VALUE>|goog.array.ArrayLike} arr The array to be searched.
 * @param {function(this:THIS, VALUE, number, ?): number} evaluator
 *     Evaluator function that receives 3 arguments (the element, the index and
 *     the array). Should return a negative number, zero, or a positive number
 *     depending on whether the desired index is before, at, or after the
 *     element passed to it.
 * @param {THIS=} opt_obj The object to be used as the value of 'this'
 *     within evaluator.
 * @return {number} Index of the leftmost element matched by the evaluator, if
 *     such exists; otherwise (-(insertion point) - 1). The insertion point is
 *     the index of the first element for which the evaluator returns negative,
 *     or arr.length if no such element exists. The return value is non-negative
 *     iff a match is found.
 * @template THIS, VALUE
 */
goog.array.binarySelect = function(arr, evaluator, opt_obj) {
  return goog.array.binarySearch_(arr, evaluator, true /* isEvaluator */,
      undefined /* opt_target */, opt_obj);
};


/**
 * Implementation of a binary search algorithm which knows how to use both
 * comparison functions and evaluators. If an evaluator is provided, will call
 * the evaluator with the given optional data object, conforming to the
 * interface defined in binarySelect. Otherwise, if a comparison function is
 * provided, will call the comparison function against the given data object.
 *
 * This implementation purposefully does not use goog.bind or goog.partial for
 * performance reasons.
 *
 * Runtime: O(log n)
 *
 * @param {Array.<VALUE>|goog.array.ArrayLike} arr The array to be searched.
 * @param {function(TARGET, VALUE): number|
 *         function(this:THIS, VALUE, number, ?): number} compareFn Either an
 *     evaluator or a comparison function, as defined by binarySearch
 *     and binarySelect above.
 * @param {boolean} isEvaluator Whether the function is an evaluator or a
 *     comparison function.
 * @param {TARGET=} opt_target If the function is a comparison function, then
 *     this is the target to binary search for.
 * @param {THIS=} opt_selfObj If the function is an evaluator, this is an
  *    optional this object for the evaluator.
 * @return {number} Lowest index of the target value if found, otherwise
 *     (-(insertion point) - 1). The insertion point is where the value should
 *     be inserted into arr to preserve the sorted property.  Return value >= 0
 *     iff target is found.
 * @template THIS, VALUE, TARGET
 * @private
 */
goog.array.binarySearch_ = function(arr, compareFn, isEvaluator, opt_target,
    opt_selfObj) {
  var left = 0;  // inclusive
  var right = arr.length;  // exclusive
  var found;
  while (left < right) {
    var middle = (left + right) >> 1;
    var compareResult;
    if (isEvaluator) {
      compareResult = compareFn.call(opt_selfObj, arr[middle], middle, arr);
    } else {
      compareResult = compareFn(opt_target, arr[middle]);
    }
    if (compareResult > 0) {
      left = middle + 1;
    } else {
      right = middle;
      // We are looking for the lowest index so we can't return immediately.
      found = !compareResult;
    }
  }
  // left is the index if found, or the insertion point otherwise.
  // ~left is a shorthand for -left - 1.
  return found ? left : ~left;
};


/**
 * Sorts the specified array into ascending order.  If no opt_compareFn is
 * specified, elements are compared using
 * <code>goog.array.defaultCompare</code>, which compares the elements using
 * the built in < and > operators.  This will produce the expected behavior
 * for homogeneous arrays of String(s) and Number(s), unlike the native sort,
 * but will give unpredictable results for heterogenous lists of strings and
 * numbers with different numbers of digits.
 *
 * This sort is not guaranteed to be stable.
 *
 * Runtime: Same as <code>Array.prototype.sort</code>
 *
 * @param {Array.<T>} arr The array to be sorted.
 * @param {?function(T,T):number=} opt_compareFn Optional comparison
 *     function by which the
 *     array is to be ordered. Should take 2 arguments to compare, and return a
 *     negative number, zero, or a positive number depending on whether the
 *     first argument is less than, equal to, or greater than the second.
 * @template T
 */
goog.array.sort = function(arr, opt_compareFn) {
  // TODO(arv): Update type annotation since null is not accepted.
  arr.sort(opt_compareFn || goog.array.defaultCompare);
};


/**
 * Sorts the specified array into ascending order in a stable way.  If no
 * opt_compareFn is specified, elements are compared using
 * <code>goog.array.defaultCompare</code>, which compares the elements using
 * the built in < and > operators.  This will produce the expected behavior
 * for homogeneous arrays of String(s) and Number(s).
 *
 * Runtime: Same as <code>Array.prototype.sort</code>, plus an additional
 * O(n) overhead of copying the array twice.
 *
 * @param {Array.<T>} arr The array to be sorted.
 * @param {?function(T, T): number=} opt_compareFn Optional comparison function
 *     by which the array is to be ordered. Should take 2 arguments to compare,
 *     and return a negative number, zero, or a positive number depending on
 *     whether the first argument is less than, equal to, or greater than the
 *     second.
 * @template T
 */
goog.array.stableSort = function(arr, opt_compareFn) {
  for (var i = 0; i < arr.length; i++) {
    arr[i] = {index: i, value: arr[i]};
  }
  var valueCompareFn = opt_compareFn || goog.array.defaultCompare;
  function stableCompareFn(obj1, obj2) {
    return valueCompareFn(obj1.value, obj2.value) || obj1.index - obj2.index;
  };
  goog.array.sort(arr, stableCompareFn);
  for (var i = 0; i < arr.length; i++) {
    arr[i] = arr[i].value;
  }
};


/**
 * Sort the specified array into ascending order based on item keys
 * returned by the specified key function.
 * If no opt_compareFn is specified, the keys are compared in ascending order
 * using <code>goog.array.defaultCompare</code>.
 *
 * Runtime: O(S(f(n)), where S is runtime of <code>goog.array.sort</code>
 * and f(n) is runtime of the key function.
 *
 * @param {Array.<T>} arr The array to be sorted.
 * @param {function(T): K} keyFn Function taking array element and returning
 *     a key used for sorting this element.
 * @param {?function(K, K): number=} opt_compareFn Optional comparison function
 *     by which the keys are to be ordered. Should take 2 arguments to compare,
 *     and return a negative number, zero, or a positive number depending on
 *     whether the first argument is less than, equal to, or greater than the
 *     second.
 * @template T
 * @template K
 */
goog.array.sortByKey = function(arr, keyFn, opt_compareFn) {
  var keyCompareFn = opt_compareFn || goog.array.defaultCompare;
  goog.array.sort(arr, function(a, b) {
    return keyCompareFn(keyFn(a), keyFn(b));
  });
};


/**
 * Sorts an array of objects by the specified object key and compare
 * function. If no compare function is provided, the key values are
 * compared in ascending order using <code>goog.array.defaultCompare</code>.
 * This won't work for keys that get renamed by the compiler. So use
 * {'foo': 1, 'bar': 2} rather than {foo: 1, bar: 2}.
 * @param {Array.<Object>} arr An array of objects to sort.
 * @param {string} key The object key to sort by.
 * @param {Function=} opt_compareFn The function to use to compare key
 *     values.
 */
goog.array.sortObjectsByKey = function(arr, key, opt_compareFn) {
  goog.array.sortByKey(arr,
      function(obj) { return obj[key]; },
      opt_compareFn);
};


/**
 * Tells if the array is sorted.
 * @param {!Array.<T>} arr The array.
 * @param {?function(T,T):number=} opt_compareFn Function to compare the
 *     array elements.
 *     Should take 2 arguments to compare, and return a negative number, zero,
 *     or a positive number depending on whether the first argument is less
 *     than, equal to, or greater than the second.
 * @param {boolean=} opt_strict If true no equal elements are allowed.
 * @return {boolean} Whether the array is sorted.
 * @template T
 */
goog.array.isSorted = function(arr, opt_compareFn, opt_strict) {
  var compare = opt_compareFn || goog.array.defaultCompare;
  for (var i = 1; i < arr.length; i++) {
    var compareResult = compare(arr[i - 1], arr[i]);
    if (compareResult > 0 || compareResult == 0 && opt_strict) {
      return false;
    }
  }
  return true;
};


/**
 * Compares two arrays for equality. Two arrays are considered equal if they
 * have the same length and their corresponding elements are equal according to
 * the comparison function.
 *
 * @param {goog.array.ArrayLike} arr1 The first array to compare.
 * @param {goog.array.ArrayLike} arr2 The second array to compare.
 * @param {Function=} opt_equalsFn Optional comparison function.
 *     Should take 2 arguments to compare, and return true if the arguments
 *     are equal. Defaults to {@link goog.array.defaultCompareEquality} which
 *     compares the elements using the built-in '===' operator.
 * @return {boolean} Whether the two arrays are equal.
 */
goog.array.equals = function(arr1, arr2, opt_equalsFn) {
  if (!goog.isArrayLike(arr1) || !goog.isArrayLike(arr2) ||
      arr1.length != arr2.length) {
    return false;
  }
  var l = arr1.length;
  var equalsFn = opt_equalsFn || goog.array.defaultCompareEquality;
  for (var i = 0; i < l; i++) {
    if (!equalsFn(arr1[i], arr2[i])) {
      return false;
    }
  }
  return true;
};


/**
 * 3-way array compare function.
 * @param {!Array.<VALUE>|!goog.array.ArrayLike} arr1 The first array to
 *     compare.
 * @param {!Array.<VALUE>|!goog.array.ArrayLike} arr2 The second array to
 *     compare.
 * @param {function(VALUE, VALUE): number=} opt_compareFn Optional comparison
 *     function by which the array is to be ordered. Should take 2 arguments to
 *     compare, and return a negative number, zero, or a positive number
 *     depending on whether the first argument is less than, equal to, or
 *     greater than the second.
 * @return {number} Negative number, zero, or a positive number depending on
 *     whether the first argument is less than, equal to, or greater than the
 *     second.
 * @template VALUE
 */
goog.array.compare3 = function(arr1, arr2, opt_compareFn) {
  var compare = opt_compareFn || goog.array.defaultCompare;
  var l = Math.min(arr1.length, arr2.length);
  for (var i = 0; i < l; i++) {
    var result = compare(arr1[i], arr2[i]);
    if (result != 0) {
      return result;
    }
  }
  return goog.array.defaultCompare(arr1.length, arr2.length);
};


/**
 * Compares its two arguments for order, using the built in < and >
 * operators.
 * @param {VALUE} a The first object to be compared.
 * @param {VALUE} b The second object to be compared.
 * @return {number} A negative number, zero, or a positive number as the first
 *     argument is less than, equal to, or greater than the second.
 * @template VALUE
 */
goog.array.defaultCompare = function(a, b) {
  return a > b ? 1 : a < b ? -1 : 0;
};


/**
 * Compares its two arguments for equality, using the built in === operator.
 * @param {*} a The first object to compare.
 * @param {*} b The second object to compare.
 * @return {boolean} True if the two arguments are equal, false otherwise.
 */
goog.array.defaultCompareEquality = function(a, b) {
  return a === b;
};


/**
 * Inserts a value into a sorted array. The array is not modified if the
 * value is already present.
 * @param {Array.<VALUE>|goog.array.ArrayLike} array The array to modify.
 * @param {VALUE} value The object to insert.
 * @param {function(VALUE, VALUE): number=} opt_compareFn Optional comparison
 *     function by which the array is ordered. Should take 2 arguments to
 *     compare, and return a negative number, zero, or a positive number
 *     depending on whether the first argument is less than, equal to, or
 *     greater than the second.
 * @return {boolean} True if an element was inserted.
 * @template VALUE
 */
goog.array.binaryInsert = function(array, value, opt_compareFn) {
  var index = goog.array.binarySearch(array, value, opt_compareFn);
  if (index < 0) {
    goog.array.insertAt(array, value, -(index + 1));
    return true;
  }
  return false;
};


/**
 * Removes a value from a sorted array.
 * @param {!Array.<VALUE>|!goog.array.ArrayLike} array The array to modify.
 * @param {VALUE} value The object to remove.
 * @param {function(VALUE, VALUE): number=} opt_compareFn Optional comparison
 *     function by which the array is ordered. Should take 2 arguments to
 *     compare, and return a negative number, zero, or a positive number
 *     depending on whether the first argument is less than, equal to, or
 *     greater than the second.
 * @return {boolean} True if an element was removed.
 * @template VALUE
 */
goog.array.binaryRemove = function(array, value, opt_compareFn) {
  var index = goog.array.binarySearch(array, value, opt_compareFn);
  return (index >= 0) ? goog.array.removeAt(array, index) : false;
};


/**
 * Splits an array into disjoint buckets according to a splitting function.
 * @param {Array.<T>} array The array.
 * @param {function(this:S, T,number,Array.<T>):?} sorter Function to call for
 *     every element.  This takes 3 arguments (the element, the index and the
 *     array) and must return a valid object key (a string, number, etc), or
 *     undefined, if that object should not be placed in a bucket.
 * @param {S=} opt_obj The object to be used as the value of 'this' within
 *     sorter.
 * @return {!Object} An object, with keys being all of the unique return values
 *     of sorter, and values being arrays containing the items for
 *     which the splitter returned that key.
 * @template T,S
 */
goog.array.bucket = function(array, sorter, opt_obj) {
  var buckets = {};

  for (var i = 0; i < array.length; i++) {
    var value = array[i];
    var key = sorter.call(opt_obj, value, i, array);
    if (goog.isDef(key)) {
      // Push the value to the right bucket, creating it if necessary.
      var bucket = buckets[key] || (buckets[key] = []);
      bucket.push(value);
    }
  }

  return buckets;
};


/**
 * Creates a new object built from the provided array and the key-generation
 * function.
 * @param {Array.<T>|goog.array.ArrayLike} arr Array or array like object over
 *     which to iterate whose elements will be the values in the new object.
 * @param {?function(this:S, T, number, ?) : string} keyFunc The function to
 *     call for every element. This function takes 3 arguments (the element, the
 *     index and the array) and should return a string that will be used as the
 *     key for the element in the new object. If the function returns the same
 *     key for more than one element, the value for that key is
 *     implementation-defined.
 * @param {S=} opt_obj The object to be used as the value of 'this'
 *     within keyFunc.
 * @return {!Object.<T>} The new object.
 * @template T,S
 */
goog.array.toObject = function(arr, keyFunc, opt_obj) {
  var ret = {};
  goog.array.forEach(arr, function(element, index) {
    ret[keyFunc.call(opt_obj, element, index, arr)] = element;
  });
  return ret;
};


/**
 * Creates a range of numbers in an arithmetic progression.
 *
 * Range takes 1, 2, or 3 arguments:
 * <pre>
 * range(5) is the same as range(0, 5, 1) and produces [0, 1, 2, 3, 4]
 * range(2, 5) is the same as range(2, 5, 1) and produces [2, 3, 4]
 * range(-2, -5, -1) produces [-2, -3, -4]
 * range(-2, -5, 1) produces [], since stepping by 1 wouldn't ever reach -5.
 * </pre>
 *
 * @param {number} startOrEnd The starting value of the range if an end argument
 *     is provided. Otherwise, the start value is 0, and this is the end value.
 * @param {number=} opt_end The optional end value of the range.
 * @param {number=} opt_step The step size between range values. Defaults to 1
 *     if opt_step is undefined or 0.
 * @return {!Array.<number>} An array of numbers for the requested range. May be
 *     an empty array if adding the step would not converge toward the end
 *     value.
 */
goog.array.range = function(startOrEnd, opt_end, opt_step) {
  var array = [];
  var start = 0;
  var end = startOrEnd;
  var step = opt_step || 1;
  if (opt_end !== undefined) {
    start = startOrEnd;
    end = opt_end;
  }

  if (step * (end - start) < 0) {
    // Sign mismatch: start + step will never reach the end value.
    return [];
  }

  if (step > 0) {
    for (var i = start; i < end; i += step) {
      array.push(i);
    }
  } else {
    for (var i = start; i > end; i += step) {
      array.push(i);
    }
  }
  return array;
};


/**
 * Returns an array consisting of the given value repeated N times.
 *
 * @param {VALUE} value The value to repeat.
 * @param {number} n The repeat count.
 * @return {!Array.<VALUE>} An array with the repeated value.
 * @template VALUE
 */
goog.array.repeat = function(value, n) {
  var array = [];
  for (var i = 0; i < n; i++) {
    array[i] = value;
  }
  return array;
};


/**
 * Returns an array consisting of every argument with all arrays
 * expanded in-place recursively.
 *
 * @param {...*} var_args The values to flatten.
 * @return {!Array.<?>} An array containing the flattened values.
 */
goog.array.flatten = function(var_args) {
  var result = [];
  for (var i = 0; i < arguments.length; i++) {
    var element = arguments[i];
    if (goog.isArray(element)) {
      result.push.apply(result, goog.array.flatten.apply(null, element));
    } else {
      result.push(element);
    }
  }
  return result;
};


/**
 * Rotates an array in-place. After calling this method, the element at
 * index i will be the element previously at index (i - n) %
 * array.length, for all values of i between 0 and array.length - 1,
 * inclusive.
 *
 * For example, suppose list comprises [t, a, n, k, s]. After invoking
 * rotate(array, 1) (or rotate(array, -4)), array will comprise [s, t, a, n, k].
 *
 * @param {!Array.<T>} array The array to rotate.
 * @param {number} n The amount to rotate.
 * @return {!Array.<T>} The array.
 * @template T
 */
goog.array.rotate = function(array, n) {
  goog.asserts.assert(array.length != null);

  if (array.length) {
    n %= array.length;
    if (n > 0) {
      goog.array.ARRAY_PROTOTYPE_.unshift.apply(array, array.splice(-n, n));
    } else if (n < 0) {
      goog.array.ARRAY_PROTOTYPE_.push.apply(array, array.splice(0, -n));
    }
  }
  return array;
};


/**
 * Moves one item of an array to a new position keeping the order of the rest
 * of the items. Example use case: keeping a list of JavaScript objects
 * synchronized with the corresponding list of DOM elements after one of the
 * elements has been dragged to a new position.
 * @param {!(Array|Arguments|{length:number})} arr The array to modify.
 * @param {number} fromIndex Index of the item to move between 0 and
 *     {@code arr.length - 1}.
 * @param {number} toIndex Target index between 0 and {@code arr.length - 1}.
 */
goog.array.moveItem = function(arr, fromIndex, toIndex) {
  goog.asserts.assert(fromIndex >= 0 && fromIndex < arr.length);
  goog.asserts.assert(toIndex >= 0 && toIndex < arr.length);
  // Remove 1 item at fromIndex.
  var removedItems = goog.array.ARRAY_PROTOTYPE_.splice.call(arr, fromIndex, 1);
  // Insert the removed item at toIndex.
  goog.array.ARRAY_PROTOTYPE_.splice.call(arr, toIndex, 0, removedItems[0]);
  // We don't use goog.array.insertAt and goog.array.removeAt, because they're
  // significantly slower than splice.
};


/**
 * Creates a new array for which the element at position i is an array of the
 * ith element of the provided arrays.  The returned array will only be as long
 * as the shortest array provided; additional values are ignored.  For example,
 * the result of zipping [1, 2] and [3, 4, 5] is [[1,3], [2, 4]].
 *
 * This is similar to the zip() function in Python.  See {@link
 * http://docs.python.org/library/functions.html#zip}
 *
 * @param {...!goog.array.ArrayLike} var_args Arrays to be combined.
 * @return {!Array.<!Array.<?>>} A new array of arrays created from
 *     provided arrays.
 */
goog.array.zip = function(var_args) {
  if (!arguments.length) {
    return [];
  }
  var result = [];
  for (var i = 0; true; i++) {
    var value = [];
    for (var j = 0; j < arguments.length; j++) {
      var arr = arguments[j];
      // If i is larger than the array length, this is the shortest array.
      if (i >= arr.length) {
        return result;
      }
      value.push(arr[i]);
    }
    result.push(value);
  }
};


/**
 * Shuffles the values in the specified array using the Fisher-Yates in-place
 * shuffle (also known as the Knuth Shuffle). By default, calls Math.random()
 * and so resets the state of that random number generator. Similarly, may reset
 * the state of the any other specified random number generator.
 *
 * Runtime: O(n)
 *
 * @param {!Array.<?>} arr The array to be shuffled.
 * @param {function():number=} opt_randFn Optional random function to use for
 *     shuffling.
 *     Takes no arguments, and returns a random number on the interval [0, 1).
 *     Defaults to Math.random() using JavaScript's built-in Math library.
 */
goog.array.shuffle = function(arr, opt_randFn) {
  var randFn = opt_randFn || Math.random;

  for (var i = arr.length - 1; i > 0; i--) {
    // Choose a random array index in [0, i] (inclusive with i).
    var j = Math.floor(randFn() * (i + 1));

    var tmp = arr[i];
    arr[i] = arr[j];
    arr[j] = tmp;
  }
};

// Copyright 2006 The Closure Library Authors. All Rights Reserved.
//
// Licensed under the Apache License, Version 2.0 (the "License");
// you may not use this file except in compliance with the License.
// You may obtain a copy of the License at
//
//      http://www.apache.org/licenses/LICENSE-2.0
//
// Unless required by applicable law or agreed to in writing, software
// distributed under the License is distributed on an "AS-IS" BASIS,
// WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
// See the License for the specific language governing permissions and
// limitations under the License.

/**
 * @fileoverview Utilities for manipulating objects/maps/hashes.
 * @author arv@google.com (Erik Arvidsson)
 */

goog.provide('goog.object');

goog.require('goog.array');


/**
 * Calls a function for each element in an object/map/hash.
 *
 * @param {Object.<K,V>} obj The object over which to iterate.
 * @param {function(this:T,V,?,Object.<K,V>):?} f The function to call
 *     for every element. This function takes 3 arguments (the element, the
 *     index and the object) and the return value is ignored.
 * @param {T=} opt_obj This is used as the 'this' object within f.
 * @template T,K,V
 */
goog.object.forEach = function(obj, f, opt_obj) {
  for (var key in obj) {
    f.call(opt_obj, obj[key], key, obj);
  }
};


/**
 * Calls a function for each element in an object/map/hash. If that call returns
 * true, adds the element to a new object.
 *
 * @param {Object.<K,V>} obj The object over which to iterate.
 * @param {function(this:T,V,?,Object.<K,V>):boolean} f The function to call
 *     for every element. This
 *     function takes 3 arguments (the element, the index and the object)
 *     and should return a boolean. If the return value is true the
 *     element is added to the result object. If it is false the
 *     element is not included.
 * @param {T=} opt_obj This is used as the 'this' object within f.
 * @return {!Object.<K,V>} a new object in which only elements that passed the
 *     test are present.
 * @template T,K,V
 */
goog.object.filter = function(obj, f, opt_obj) {
  var res = {};
  for (var key in obj) {
    if (f.call(opt_obj, obj[key], key, obj)) {
      res[key] = obj[key];
    }
  }
  return res;
};


/**
 * For every element in an object/map/hash calls a function and inserts the
 * result into a new object.
 *
 * @param {Object.<K,V>} obj The object over which to iterate.
 * @param {function(this:T,V,?,Object.<K,V>):R} f The function to call
 *     for every element. This function
 *     takes 3 arguments (the element, the index and the object)
 *     and should return something. The result will be inserted
 *     into a new object.
 * @param {T=} opt_obj This is used as the 'this' object within f.
 * @return {!Object.<K,R>} a new object with the results from f.
 * @template T,K,V,R
 */
goog.object.map = function(obj, f, opt_obj) {
  var res = {};
  for (var key in obj) {
    res[key] = f.call(opt_obj, obj[key], key, obj);
  }
  return res;
};


/**
 * Calls a function for each element in an object/map/hash. If any
 * call returns true, returns true (without checking the rest). If
 * all calls return false, returns false.
 *
 * @param {Object.<K,V>} obj The object to check.
 * @param {function(this:T,V,?,Object.<K,V>):boolean} f The function to
 *     call for every element. This function
 *     takes 3 arguments (the element, the index and the object) and should
 *     return a boolean.
 * @param {T=} opt_obj This is used as the 'this' object within f.
 * @return {boolean} true if any element passes the test.
 * @template T,K,V
 */
goog.object.some = function(obj, f, opt_obj) {
  for (var key in obj) {
    if (f.call(opt_obj, obj[key], key, obj)) {
      return true;
    }
  }
  return false;
};


/**
 * Calls a function for each element in an object/map/hash. If
 * all calls return true, returns true. If any call returns false, returns
 * false at this point and does not continue to check the remaining elements.
 *
 * @param {Object.<K,V>} obj The object to check.
 * @param {?function(this:T,V,?,Object.<K,V>):boolean} f The function to
 *     call for every element. This function
 *     takes 3 arguments (the element, the index and the object) and should
 *     return a boolean.
 * @param {T=} opt_obj This is used as the 'this' object within f.
 * @return {boolean} false if any element fails the test.
 * @template T,K,V
 */
goog.object.every = function(obj, f, opt_obj) {
  for (var key in obj) {
    if (!f.call(opt_obj, obj[key], key, obj)) {
      return false;
    }
  }
  return true;
};


/**
 * Returns the number of key-value pairs in the object map.
 *
 * @param {Object} obj The object for which to get the number of key-value
 *     pairs.
 * @return {number} The number of key-value pairs in the object map.
 */
goog.object.getCount = function(obj) {
  // JS1.5 has __count__ but it has been deprecated so it raises a warning...
  // in other words do not use. Also __count__ only includes the fields on the
  // actual object and not in the prototype chain.
  var rv = 0;
  for (var key in obj) {
    rv++;
  }
  return rv;
};


/**
 * Returns one key from the object map, if any exists.
 * For map literals the returned key will be the first one in most of the
 * browsers (a know exception is Konqueror).
 *
 * @param {Object} obj The object to pick a key from.
 * @return {string|undefined} The key or undefined if the object is empty.
 */
goog.object.getAnyKey = function(obj) {
  for (var key in obj) {
    return key;
  }
};


/**
 * Returns one value from the object map, if any exists.
 * For map literals the returned value will be the first one in most of the
 * browsers (a know exception is Konqueror).
 *
 * @param {Object.<K,V>} obj The object to pick a value from.
 * @return {V|undefined} The value or undefined if the object is empty.
 * @template K,V
 */
goog.object.getAnyValue = function(obj) {
  for (var key in obj) {
    return obj[key];
  }
};


/**
 * Whether the object/hash/map contains the given object as a value.
 * An alias for goog.object.containsValue(obj, val).
 *
 * @param {Object.<K,V>} obj The object in which to look for val.
 * @param {V} val The object for which to check.
 * @return {boolean} true if val is present.
 * @template K,V
 */
goog.object.contains = function(obj, val) {
  return goog.object.containsValue(obj, val);
};


/**
 * Returns the values of the object/map/hash.
 *
 * @param {Object.<K,V>} obj The object from which to get the values.
 * @return {!Array.<V>} The values in the object/map/hash.
 * @template K,V
 */
goog.object.getValues = function(obj) {
  var res = [];
  var i = 0;
  for (var key in obj) {
    res[i++] = obj[key];
  }
  return res;
};


/**
 * Returns the keys of the object/map/hash.
 *
 * @param {Object} obj The object from which to get the keys.
 * @return {!Array.<string>} Array of property keys.
 */
goog.object.getKeys = function(obj) {
  var res = [];
  var i = 0;
  for (var key in obj) {
    res[i++] = key;
  }
  return res;
};


/**
 * Get a value from an object multiple levels deep.  This is useful for
 * pulling values from deeply nested objects, such as JSON responses.
 * Example usage: getValueByKeys(jsonObj, 'foo', 'entries', 3)
 *
 * @param {!Object} obj An object to get the value from.  Can be array-like.
 * @param {...(string|number|!Array.<number|string>)} var_args A number of keys
 *     (as strings, or numbers, for array-like objects).  Can also be
 *     specified as a single array of keys.
 * @return {*} The resulting value.  If, at any point, the value for a key
 *     is undefined, returns undefined.
 */
goog.object.getValueByKeys = function(obj, var_args) {
  var isArrayLike = goog.isArrayLike(var_args);
  var keys = isArrayLike ? var_args : arguments;

  // Start with the 2nd parameter for the variable parameters syntax.
  for (var i = isArrayLike ? 0 : 1; i < keys.length; i++) {
    obj = obj[keys[i]];
    if (!goog.isDef(obj)) {
      break;
    }
  }

  return obj;
};


/**
 * Whether the object/map/hash contains the given key.
 *
 * @param {Object} obj The object in which to look for key.
 * @param {*} key The key for which to check.
 * @return {boolean} true If the map contains the key.
 */
goog.object.containsKey = function(obj, key) {
  return key in obj;
};


/**
 * Whether the object/map/hash contains the given value. This is O(n).
 *
 * @param {Object.<K,V>} obj The object in which to look for val.
 * @param {V} val The value for which to check.
 * @return {boolean} true If the map contains the value.
 * @template K,V
 */
goog.object.containsValue = function(obj, val) {
  for (var key in obj) {
    if (obj[key] == val) {
      return true;
    }
  }
  return false;
};


/**
 * Searches an object for an element that satisfies the given condition and
 * returns its key.
 * @param {Object.<K,V>} obj The object to search in.
 * @param {function(this:T,V,string,Object.<K,V>):boolean} f The
 *      function to call for every element. Takes 3 arguments (the value,
 *     the key and the object) and should return a boolean.
 * @param {T=} opt_this An optional "this" context for the function.
 * @return {string|undefined} The key of an element for which the function
 *     returns true or undefined if no such element is found.
 * @template T,K,V
 */
goog.object.findKey = function(obj, f, opt_this) {
  for (var key in obj) {
    if (f.call(opt_this, obj[key], key, obj)) {
      return key;
    }
  }
  return undefined;
};


/**
 * Searches an object for an element that satisfies the given condition and
 * returns its value.
 * @param {Object.<K,V>} obj The object to search in.
 * @param {function(this:T,V,string,Object.<K,V>):boolean} f The function
 *     to call for every element. Takes 3 arguments (the value, the key
 *     and the object) and should return a boolean.
 * @param {T=} opt_this An optional "this" context for the function.
 * @return {V} The value of an element for which the function returns true or
 *     undefined if no such element is found.
 * @template T,K,V
 */
goog.object.findValue = function(obj, f, opt_this) {
  var key = goog.object.findKey(obj, f, opt_this);
  return key && obj[key];
};


/**
 * Whether the object/map/hash is empty.
 *
 * @param {Object} obj The object to test.
 * @return {boolean} true if obj is empty.
 */
goog.object.isEmpty = function(obj) {
  for (var key in obj) {
    return false;
  }
  return true;
};


/**
 * Removes all key value pairs from the object/map/hash.
 *
 * @param {Object} obj The object to clear.
 */
goog.object.clear = function(obj) {
  for (var i in obj) {
    delete obj[i];
  }
};


/**
 * Removes a key-value pair based on the key.
 *
 * @param {Object} obj The object from which to remove the key.
 * @param {*} key The key to remove.
 * @return {boolean} Whether an element was removed.
 */
goog.object.remove = function(obj, key) {
  var rv;
  if ((rv = key in obj)) {
    delete obj[key];
  }
  return rv;
};


/**
 * Adds a key-value pair to the object. Throws an exception if the key is
 * already in use. Use set if you want to change an existing pair.
 *
 * @param {Object.<K,V>} obj The object to which to add the key-value pair.
 * @param {string} key The key to add.
 * @param {V} val The value to add.
 * @template K,V
 */
goog.object.add = function(obj, key, val) {
  if (key in obj) {
    throw Error('The object already contains the key "' + key + '"');
  }
  goog.object.set(obj, key, val);
};


/**
 * Returns the value for the given key.
 *
 * @param {Object.<K,V>} obj The object from which to get the value.
 * @param {string} key The key for which to get the value.
 * @param {R=} opt_val The value to return if no item is found for the given
 *     key (default is undefined).
 * @return {V|R|undefined} The value for the given key.
 * @template K,V,R
 */
goog.object.get = function(obj, key, opt_val) {
  if (key in obj) {
    return obj[key];
  }
  return opt_val;
};


/**
 * Adds a key-value pair to the object/map/hash.
 *
 * @param {Object.<K,V>} obj The object to which to add the key-value pair.
 * @param {string} key The key to add.
 * @param {V} value The value to add.
 * @template K,V
 */
goog.object.set = function(obj, key, value) {
  obj[key] = value;
};


/**
 * Adds a key-value pair to the object/map/hash if it doesn't exist yet.
 *
 * @param {Object.<K,V>} obj The object to which to add the key-value pair.
 * @param {string} key The key to add.
 * @param {V} value The value to add if the key wasn't present.
 * @return {V} The value of the entry at the end of the function.
 * @template K,V
 */
goog.object.setIfUndefined = function(obj, key, value) {
  return key in obj ? obj[key] : (obj[key] = value);
};


/**
 * Compares two objects for equality using === on the values.
 *
 * @param {!Object.<K,V>} a
 * @param {!Object.<K,V>} b
 * @return {boolean}
 * @template K,V
 */
goog.object.equals = function(a, b) {
  if (!goog.array.equals(goog.object.getKeys(a), goog.object.getKeys(b))) {
    return false;
  }
  for (var k in a) {
    if (a[k] !== b[k]) {
      return false;
    }
  }
  return true;
};


/**
 * Does a flat clone of the object.
 *
 * @param {Object.<K,V>} obj Object to clone.
 * @return {!Object.<K,V>} Clone of the input object.
 * @template K,V
 */
goog.object.clone = function(obj) {
  // We cannot use the prototype trick because a lot of methods depend on where
  // the actual key is set.

  var res = {};
  for (var key in obj) {
    res[key] = obj[key];
  }
  return res;
  // We could also use goog.mixin but I wanted this to be independent from that.
};


/**
 * Clones a value. The input may be an Object, Array, or basic type. Objects and
 * arrays will be cloned recursively.
 *
 * WARNINGS:
 * <code>goog.object.unsafeClone</code> does not detect reference loops. Objects
 * that refer to themselves will cause infinite recursion.
 *
 * <code>goog.object.unsafeClone</code> is unaware of unique identifiers, and
 * copies UIDs created by <code>getUid</code> into cloned results.
 *
 * @param {*} obj The value to clone.
 * @return {*} A clone of the input value.
 */
goog.object.unsafeClone = function(obj) {
  var type = goog.typeOf(obj);
  if (type == 'object' || type == 'array') {
    if (obj.clone) {
      return obj.clone();
    }
    var clone = type == 'array' ? [] : {};
    for (var key in obj) {
      clone[key] = goog.object.unsafeClone(obj[key]);
    }
    return clone;
  }

  return obj;
};


/**
 * Returns a new object in which all the keys and values are interchanged
 * (keys become values and values become keys). If multiple keys map to the
 * same value, the chosen transposed value is implementation-dependent.
 *
 * @param {Object} obj The object to transpose.
 * @return {!Object} The transposed object.
 */
goog.object.transpose = function(obj) {
  var transposed = {};
  for (var key in obj) {
    transposed[obj[key]] = key;
  }
  return transposed;
};


/**
 * The names of the fields that are defined on Object.prototype.
 * @type {Array.<string>}
 * @private
 */
goog.object.PROTOTYPE_FIELDS_ = [
  'constructor',
  'hasOwnProperty',
  'isPrototypeOf',
  'propertyIsEnumerable',
  'toLocaleString',
  'toString',
  'valueOf'
];


/**
 * Extends an object with another object.
 * This operates 'in-place'; it does not create a new Object.
 *
 * Example:
 * var o = {};
 * goog.object.extend(o, {a: 0, b: 1});
 * o; // {a: 0, b: 1}
 * goog.object.extend(o, {b: 2, c: 3});
 * o; // {a: 0, b: 2, c: 3}
 *
 * @param {Object} target The object to modify. Existing properties will be
 *     overwritten if they are also present in one of the objects in
 *     {@code var_args}.
 * @param {...Object} var_args The objects from which values will be copied.
 */
goog.object.extend = function(target, var_args) {
  var key, source;
  for (var i = 1; i < arguments.length; i++) {
    source = arguments[i];
    for (key in source) {
      target[key] = source[key];
    }

    // For IE the for-in-loop does not contain any properties that are not
    // enumerable on the prototype object (for example isPrototypeOf from
    // Object.prototype) and it will also not include 'replace' on objects that
    // extend String and change 'replace' (not that it is common for anyone to
    // extend anything except Object).

    for (var j = 0; j < goog.object.PROTOTYPE_FIELDS_.length; j++) {
      key = goog.object.PROTOTYPE_FIELDS_[j];
      if (Object.prototype.hasOwnProperty.call(source, key)) {
        target[key] = source[key];
      }
    }
  }
};


/**
 * Creates a new object built from the key-value pairs provided as arguments.
 * @param {...*} var_args If only one argument is provided and it is an array
 *     then this is used as the arguments,  otherwise even arguments are used as
 *     the property names and odd arguments are used as the property values.
 * @return {!Object} The new object.
 * @throws {Error} If there are uneven number of arguments or there is only one
 *     non array argument.
 */
goog.object.create = function(var_args) {
  var argLength = arguments.length;
  if (argLength == 1 && goog.isArray(arguments[0])) {
    return goog.object.create.apply(null, arguments[0]);
  }

  if (argLength % 2) {
    throw Error('Uneven number of arguments');
  }

  var rv = {};
  for (var i = 0; i < argLength; i += 2) {
    rv[arguments[i]] = arguments[i + 1];
  }
  return rv;
};


/**
 * Creates a new object where the property names come from the arguments but
 * the value is always set to true
 * @param {...*} var_args If only one argument is provided and it is an array
 *     then this is used as the arguments,  otherwise the arguments are used
 *     as the property names.
 * @return {!Object} The new object.
 */
goog.object.createSet = function(var_args) {
  var argLength = arguments.length;
  if (argLength == 1 && goog.isArray(arguments[0])) {
    return goog.object.createSet.apply(null, arguments[0]);
  }

  var rv = {};
  for (var i = 0; i < argLength; i++) {
    rv[arguments[i]] = true;
  }
  return rv;
};


/**
 * Creates an immutable view of the underlying object, if the browser
 * supports immutable objects.
 *
 * In default mode, writes to this view will fail silently. In strict mode,
 * they will throw an error.
 *
 * @param {!Object.<K,V>} obj An object.
 * @return {!Object.<K,V>} An immutable view of that object, or the
 *     original object if this browser does not support immutables.
 * @template K,V
 */
goog.object.createImmutableView = function(obj) {
  var result = obj;
  if (Object.isFrozen && !Object.isFrozen(obj)) {
    result = Object.create(obj);
    Object.freeze(result);
  }
  return result;
};


/**
 * @param {!Object} obj An object.
 * @return {boolean} Whether this is an immutable view of the object.
 */
goog.object.isImmutableView = function(obj) {
  return !!Object.isFrozen && Object.isFrozen(obj);
};

// Copyright 2013 The Closure Library Authors. All Rights Reserved.
//
// Licensed under the Apache License, Version 2.0 (the "License");
// you may not use this file except in compliance with the License.
// You may obtain a copy of the License at
//
//      http://www.apache.org/licenses/LICENSE-2.0
//
// Unless required by applicable law or agreed to in writing, software
// distributed under the License is distributed on an "AS-IS" BASIS,
// WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
// See the License for the specific language governing permissions and
// limitations under the License.

/**
 * @fileoverview Utilities used by goog.labs.userAgent tools. These functions
 * should not be used outside of goog.labs.userAgent.*.
 *
 * @visibility {//closure/goog/bin/sizetests:__pkg__}
 * @visibility {//closure/goog/dom:__subpackages__}
 * @visibility {//closure/goog/style:__pkg__}
 * @visibility {//closure/goog/testing:__pkg__}
 * @visibility {//closure/goog/useragent:__subpackages__}
 * @visibility {//testing/puppet/modules:__pkg__} *
 *
 * @author nnaze@google.com (Nathan Naze)
 */

goog.provide('goog.labs.userAgent.util');

goog.require('goog.string');


/**
 * Gets the native userAgent string from navigator if it exists.
 * If navigator or navigator.userAgent string is missing, returns an empty
 * string.
 * @return {string}
 * @private
 */
goog.labs.userAgent.util.getNativeUserAgentString_ = function() {
  var navigator = goog.labs.userAgent.util.getNavigator_();
  if (navigator) {
    var userAgent = navigator.userAgent;
    if (userAgent) {
      return userAgent;
    }
  }
  return '';
};


/**
 * Getter for the native navigator.
 * This is a separate function so it can be stubbed out in testing.
 * @return {Navigator}
 * @private
 */
goog.labs.userAgent.util.getNavigator_ = function() {
  return goog.global.navigator;
};


/**
 * A possible override for applications which wish to not check
 * navigator.userAgent but use a specified value for detection instead.
 * @private {string}
 */
goog.labs.userAgent.util.userAgent_ =
    goog.labs.userAgent.util.getNativeUserAgentString_();


/**
 * Applications may override browser detection on the built in
 * navigator.userAgent object by setting this string. Set to null to use the
 * browser object instead.
 * @param {?string=} opt_userAgent The User-Agent override.
 */
goog.labs.userAgent.util.setUserAgent = function(opt_userAgent) {
  goog.labs.userAgent.util.userAgent_ = opt_userAgent ||
      goog.labs.userAgent.util.getNativeUserAgentString_();
};


/**
 * @return {string} The user agent string.
 */
goog.labs.userAgent.util.getUserAgent = function() {
  return goog.labs.userAgent.util.userAgent_;
};


/**
 * @param {string} str
 * @return {boolean} Whether the user agent contains the given string, ignoring
 *     case.
 */
goog.labs.userAgent.util.matchUserAgent = function(str) {
  var userAgent = goog.labs.userAgent.util.getUserAgent();
  return goog.string.contains(userAgent, str);
};


/**
 * @param {string} str
 * @return {boolean} Whether the user agent contains the given string.
 */
goog.labs.userAgent.util.matchUserAgentIgnoreCase = function(str) {
  var userAgent = goog.labs.userAgent.util.getUserAgent();
  return goog.string.caseInsensitiveContains(userAgent, str);
};


/**
 * Parses the user agent into tuples for each section.
 * @param {string} userAgent
 * @return {!Array.<!Array.<string>>} Tuples of key, version, and the contents
 *     of the parenthetical.
 */
goog.labs.userAgent.util.extractVersionTuples = function(userAgent) {
  // Matches each section of a user agent string.
  // Example UA:
  // Mozilla/5.0 (iPad; U; CPU OS 3_2_1 like Mac OS X; en-us)
  // AppleWebKit/531.21.10 (KHTML, like Gecko) Mobile/7B405
  // This has three version tuples: Mozilla, AppleWebKit, and Mobile.

  var versionRegExp = new RegExp(
      // Key. Note that a key may have a space.
      // (i.e. 'Mobile Safari' in 'Mobile Safari/5.0')
      '(\\w[\\w ]+)' +

      '/' +                // slash
      '([^\\s]+)' +        // version (i.e. '5.0b')
      '\\s*' +             // whitespace
      '(?:\\((.*?)\\))?',  // parenthetical info. parentheses not matched.
      'g');

  var data = [];
  var match;

  // Iterate and collect the version tuples.  Each iteration will be the
  // next regex match.
  while (match = versionRegExp.exec(userAgent)) {
    data.push([
      match[1],  // key
      match[2],  // value
      // || undefined as this is not undefined in IE7 and IE8
      match[3] || undefined  // info
    ]);
  }

  return data;
};


// Copyright 2013 The Closure Library Authors. All Rights Reserved.
//
// Licensed under the Apache License, Version 2.0 (the "License");
// you may not use this file except in compliance with the License.
// You may obtain a copy of the License at
//
//      http://www.apache.org/licenses/LICENSE-2.0
//
// Unless required by applicable law or agreed to in writing, software
// distributed under the License is distributed on an "AS-IS" BASIS,
// WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
// See the License for the specific language governing permissions and
// limitations under the License.

/**
 * @fileoverview Closure user agent detection (Browser).
 * @see <a href="http://www.useragentstring.com/">User agent strings</a>
 * For more information on rendering engine, platform, or device see the other
 * sub-namespaces in goog.labs.userAgent, goog.labs.userAgent.platform,
 * goog.labs.userAgent.device respectively.)
 *
 * @author martone@google.com (Andy Martone)
 */

goog.provide('goog.labs.userAgent.browser');

goog.require('goog.array');
goog.require('goog.labs.userAgent.util');
goog.require('goog.object');
goog.require('goog.string');


/**
 * @return {boolean} Whether the user's browser is Opera.
 * @private
 */
goog.labs.userAgent.browser.matchOpera_ = function() {
  return goog.labs.userAgent.util.matchUserAgent('Opera') ||
      goog.labs.userAgent.util.matchUserAgent('OPR');
};


/**
 * @return {boolean} Whether the user's browser is IE.
 * @private
 */
goog.labs.userAgent.browser.matchIE_ = function() {
  return goog.labs.userAgent.util.matchUserAgent('Trident') ||
      goog.labs.userAgent.util.matchUserAgent('MSIE');
};


/**
 * @return {boolean} Whether the user's browser is Firefox.
 * @private
 */
goog.labs.userAgent.browser.matchFirefox_ = function() {
  return goog.labs.userAgent.util.matchUserAgent('Firefox');
};


/**
 * @return {boolean} Whether the user's browser is Safari.
 * @private
 */
goog.labs.userAgent.browser.matchSafari_ = function() {
  return goog.labs.userAgent.util.matchUserAgent('Safari') &&
      !goog.labs.userAgent.util.matchUserAgent('Chrome') &&
      !goog.labs.userAgent.util.matchUserAgent('CriOS') &&
      !goog.labs.userAgent.util.matchUserAgent('Android');
};


/**
 * @return {boolean} Whether the user's browser is Chrome.
 * @private
 */
goog.labs.userAgent.browser.matchChrome_ = function() {
  return goog.labs.userAgent.util.matchUserAgent('Chrome') ||
      goog.labs.userAgent.util.matchUserAgent('CriOS');
};


/**
 * @return {boolean} Whether the user's browser is the Android browser.
 * @private
 */
goog.labs.userAgent.browser.matchAndroidBrowser_ = function() {
  // Android can appear in the user agent string for Chrome on Android.
  // This is not the Android standalone browser if it does.
  return !goog.labs.userAgent.browser.isChrome() &&
      goog.labs.userAgent.util.matchUserAgent('Android');

};


/**
 * @return {boolean} Whether the user's browser is Opera.
 */
goog.labs.userAgent.browser.isOpera = goog.labs.userAgent.browser.matchOpera_;


/**
 * @return {boolean} Whether the user's browser is IE.
 */
goog.labs.userAgent.browser.isIE = goog.labs.userAgent.browser.matchIE_;


/**
 * @return {boolean} Whether the user's browser is Firefox.
 */
goog.labs.userAgent.browser.isFirefox =
    goog.labs.userAgent.browser.matchFirefox_;


/**
 * @return {boolean} Whether the user's browser is Safari.
 */
goog.labs.userAgent.browser.isSafari =
    goog.labs.userAgent.browser.matchSafari_;


/**
 * @return {boolean} Whether the user's browser is Chrome.
 */
goog.labs.userAgent.browser.isChrome =
    goog.labs.userAgent.browser.matchChrome_;


/**
 * @return {boolean} Whether the user's browser is the Android browser.
 */
goog.labs.userAgent.browser.isAndroidBrowser =
    goog.labs.userAgent.browser.matchAndroidBrowser_;


/**
 * For more information, see:
 * http://docs.aws.amazon.com/silk/latest/developerguide/user-agent.html
 * @return {boolean} Whether the user's browser is Silk.
 */
goog.labs.userAgent.browser.isSilk = function() {
  return goog.labs.userAgent.util.matchUserAgent('Silk');
};


/**
 * @return {string} The browser version or empty string if version cannot be
 *     determined. Note that for Internet Explorer, this returns the version of
 *     the browser, not the version of the rendering engine. (IE 8 in
 *     compatibility mode will return 8.0 rather than 7.0. To determine the
 *     rendering engine version, look at document.documentMode instead. See
 *     http://msdn.microsoft.com/en-us/library/cc196988(v=vs.85).aspx for more
 *     details.)
 */
goog.labs.userAgent.browser.getVersion = function() {
  var userAgentString = goog.labs.userAgent.util.getUserAgent();
  // Special case IE since IE's version is inside the parenthesis and
  // without the '/'.
  if (goog.labs.userAgent.browser.isIE()) {
    return goog.labs.userAgent.browser.getIEVersion_(userAgentString);
  }

  var versionTuples = goog.labs.userAgent.util.extractVersionTuples(
      userAgentString);

  // Construct a map for easy lookup.
  var versionMap = {};
  goog.array.forEach(versionTuples, function(tuple) {
    // Note that the tuple is of length three, but we only care about the
    // first two.
    var key = tuple[0];
    var value = tuple[1];
    versionMap[key] = value;
  });

  var versionMapHasKey = goog.partial(goog.object.containsKey, versionMap);

  // Gives the value with the first key it finds, otherwise empty string.
  function lookUpValueWithKeys(keys) {
    var key = goog.array.find(keys, versionMapHasKey);
    return versionMap[key] || '';
  }

  // Check Opera before Chrome since Opera 15+ has "Chrome" in the string.
  // See
  // http://my.opera.com/ODIN/blog/2013/07/15/opera-user-agent-strings-opera-15-and-beyond
  if (goog.labs.userAgent.browser.isOpera()) {
    // Opera 10 has Version/10.0 but Opera/9.8, so look for "Version" first.
    // Opera uses 'OPR' for more recent UAs.
    return lookUpValueWithKeys(['Version', 'Opera', 'OPR']);
  }

  if (goog.labs.userAgent.browser.isChrome()) {
    return lookUpValueWithKeys(['Chrome', 'CriOS']);
  }

  // Usually products browser versions are in the third tuple after "Mozilla"
  // and the engine.
  var tuple = versionTuples[2];
  return tuple && tuple[1] || '';
};


/**
 * @param {string|number} version The version to check.
 * @return {boolean} Whether the browser version is higher or the same as the
 *     given version.
 */
goog.labs.userAgent.browser.isVersionOrHigher = function(version) {
  return goog.string.compareVersions(goog.labs.userAgent.browser.getVersion(),
                                     version) >= 0;
};


/**
 * Determines IE version. More information:
 * http://msdn.microsoft.com/en-us/library/ie/bg182625(v=vs.85).aspx#uaString
 * http://msdn.microsoft.com/en-us/library/hh869301(v=vs.85).aspx
 * http://blogs.msdn.com/b/ie/archive/2010/03/23/introducing-ie9-s-user-agent-string.aspx
 * http://blogs.msdn.com/b/ie/archive/2009/01/09/the-internet-explorer-8-user-agent-string-updated-edition.aspx
 *
 * @param {string} userAgent the User-Agent.
 * @return {string}
 * @private
 */
goog.labs.userAgent.browser.getIEVersion_ = function(userAgent) {
  // IE11 may identify itself as MSIE 9.0 or MSIE 10.0 due to an IE 11 upgrade
  // bug. Example UA:
  // Mozilla/5.0 (MSIE 9.0; Windows NT 6.1; WOW64; Trident/7.0; rv:11.0)
  // like Gecko.
  // See http://www.whatismybrowser.com/developers/unknown-user-agent-fragments.
  var rv = /rv: *([\d\.]*)/.exec(userAgent);
  if (rv && rv[1]) {
    return rv[1];
  }

  var version = '';
  var msie = /MSIE +([\d\.]+)/.exec(userAgent);
  if (msie && msie[1]) {
    // IE in compatibility mode usually identifies itself as MSIE 7.0; in this
    // case, use the Trident version to determine the version of IE. For more
    // details, see the links above.
    var tridentVersion = /Trident\/(\d.\d)/.exec(userAgent);
    if (msie[1] == '7.0') {
      if (tridentVersion && tridentVersion[1]) {
        switch (tridentVersion[1]) {
          case '4.0':
            version = '8.0';
            break;
          case '5.0':
            version = '9.0';
            break;
          case '6.0':
            version = '10.0';
            break;
          case '7.0':
            version = '11.0';
            break;
        }
      } else {
        version = '7.0';
      }
    } else {
      version = msie[1];
    }
  }
  return version;
};

// Copyright 2013 The Closure Library Authors. All Rights Reserved.
//
// Licensed under the Apache License, Version 2.0 (the "License");
// you may not use this file except in compliance with the License.
// You may obtain a copy of the License at
//
//      http://www.apache.org/licenses/LICENSE-2.0
//
// Unless required by applicable law or agreed to in writing, software
// distributed under the License is distributed on an "AS-IS" BASIS,
// WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
// See the License for the specific language governing permissions and
// limitations under the License.

/**
 * @fileoverview Closure user agent detection.
 * @see http://en.wikipedia.org/wiki/User_agent
 * For more information on browser brand, platform, or device see the other
 * sub-namespaces in goog.labs.userAgent (browser, platform, and device).
 *
 */

goog.provide('goog.labs.userAgent.engine');

goog.require('goog.array');
goog.require('goog.labs.userAgent.util');
goog.require('goog.string');


/**
 * @return {boolean} Whether the rendering engine is Presto.
 */
goog.labs.userAgent.engine.isPresto = function() {
  return goog.labs.userAgent.util.matchUserAgent('Presto');
};


/**
 * @return {boolean} Whether the rendering engine is Trident.
 */
goog.labs.userAgent.engine.isTrident = function() {
  // IE only started including the Trident token in IE8.
  return goog.labs.userAgent.util.matchUserAgent('Trident') ||
      goog.labs.userAgent.util.matchUserAgent('MSIE');
};


/**
 * @return {boolean} Whether the rendering engine is WebKit.
 */
goog.labs.userAgent.engine.isWebKit = function() {
  return goog.labs.userAgent.util.matchUserAgentIgnoreCase('WebKit');
};


/**
 * @return {boolean} Whether the rendering engine is Gecko.
 */
goog.labs.userAgent.engine.isGecko = function() {
  return goog.labs.userAgent.util.matchUserAgent('Gecko') &&
      !goog.labs.userAgent.engine.isWebKit() &&
      !goog.labs.userAgent.engine.isTrident();
};


/**
 * @return {string} The rendering engine's version or empty string if version
 *     can't be determined.
 */
goog.labs.userAgent.engine.getVersion = function() {
  var userAgentString = goog.labs.userAgent.util.getUserAgent();
  if (userAgentString) {
    var tuples = goog.labs.userAgent.util.extractVersionTuples(
        userAgentString);

    var engineTuple = tuples[1];
    if (engineTuple) {
      // In Gecko, the version string is either in the browser info or the
      // Firefox version.  See Gecko user agent string reference:
      // http://goo.gl/mULqa
      if (engineTuple[0] == 'Gecko') {
        return goog.labs.userAgent.engine.getVersionForKey_(
            tuples, 'Firefox');
      }

      return engineTuple[1];
    }

    // IE has only one version identifier, and the Trident version is
    // specified in the parenthetical.
    var browserTuple = tuples[0];
    var info;
    if (browserTuple && (info = browserTuple[2])) {
      var match = /Trident\/([^\s;]+)/.exec(info);
      if (match) {
        return match[1];
      }
    }
  }
  return '';
};


/**
 * @param {string|number} version The version to check.
 * @return {boolean} Whether the rendering engine version is higher or the same
 *     as the given version.
 */
goog.labs.userAgent.engine.isVersionOrHigher = function(version) {
  return goog.string.compareVersions(goog.labs.userAgent.engine.getVersion(),
                                     version) >= 0;
};


/**
 * @param {!Array.<!Array.<string>>} tuples Version tuples.
 * @param {string} key The key to look for.
 * @return {string} The version string of the given key, if present.
 *     Otherwise, the empty string.
 * @private
 */
goog.labs.userAgent.engine.getVersionForKey_ = function(tuples, key) {
  // TODO(nnaze): Move to util if useful elsewhere.

  var pair = goog.array.find(tuples, function(pair) {
    return key == pair[0];
  });

  return pair && pair[1] || '';
};

// Copyright 2009 The Closure Library Authors. All Rights Reserved.
//
// Licensed under the Apache License, Version 2.0 (the "License");
// you may not use this file except in compliance with the License.
// You may obtain a copy of the License at
//
//      http://www.apache.org/licenses/LICENSE-2.0
//
// Unless required by applicable law or agreed to in writing, software
// distributed under the License is distributed on an "AS-IS" BASIS,
// WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
// See the License for the specific language governing permissions and
// limitations under the License.

/**
 * @fileoverview Useful compiler idioms.
 *
 * @author johnlenz@google.com (John Lenz)
 */

goog.provide('goog.reflect');


/**
 * Syntax for object literal casts.
 * @see http://go/jscompiler-renaming
 * @see http://code.google.com/p/closure-compiler/wiki/
 *      ExperimentalTypeBasedPropertyRenaming
 *
 * Use this if you have an object literal whose keys need to have the same names
 * as the properties of some class even after they are renamed by the compiler.
 *
 * @param {!Function} type Type to cast to.
 * @param {Object} object Object literal to cast.
 * @return {Object} The object literal.
 */
goog.reflect.object = function(type, object) {
  return object;
};


/**
 * To assert to the compiler that an operation is needed when it would
 * otherwise be stripped. For example:
 * <code>
 *     // Force a layout
 *     goog.reflect.sinkValue(dialog.offsetHeight);
 * </code>
 * @type {!Function}
 */
goog.reflect.sinkValue = function(x) {
  goog.reflect.sinkValue[' '](x);
  return x;
};


/**
 * The compiler should optimize this function away iff no one ever uses
 * goog.reflect.sinkValue.
 */
goog.reflect.sinkValue[' '] = goog.nullFunction;


/**
 * Check if a property can be accessed without throwing an exception.
 * @param {Object} obj The owner of the property.
 * @param {string} prop The property name.
 * @return {boolean} Whether the property is accessible. Will also return true
 *     if obj is null.
 */
goog.reflect.canAccessProperty = function(obj, prop) {
  /** @preserveTry */
  try {
    goog.reflect.sinkValue(obj[prop]);
    return true;
  } catch (e) {}
  return false;
};

// Copyright 2006 The Closure Library Authors. All Rights Reserved.
//
// Licensed under the Apache License, Version 2.0 (the "License");
// you may not use this file except in compliance with the License.
// You may obtain a copy of the License at
//
//      http://www.apache.org/licenses/LICENSE-2.0
//
// Unless required by applicable law or agreed to in writing, software
// distributed under the License is distributed on an "AS-IS" BASIS,
// WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
// See the License for the specific language governing permissions and
// limitations under the License.

/**
 * @fileoverview Rendering engine detection.
 * @see <a href="http://www.useragentstring.com/">User agent strings</a>
 * For information on the browser brand (such as Safari versus Chrome), see
 * goog.userAgent.product.
 * @author arv@google.com (Erik Arvidsson)
 * @see ../demos/useragent.html
 */

goog.provide('goog.userAgent');

goog.require('goog.labs.userAgent.browser');
goog.require('goog.labs.userAgent.engine');
goog.require('goog.labs.userAgent.util');
goog.require('goog.string');


/**
 * @define {boolean} Whether we know at compile-time that the browser is IE.
 */
goog.define('goog.userAgent.ASSUME_IE', false);


/**
 * @define {boolean} Whether we know at compile-time that the browser is GECKO.
 */
goog.define('goog.userAgent.ASSUME_GECKO', false);


/**
 * @define {boolean} Whether we know at compile-time that the browser is WEBKIT.
 */
goog.define('goog.userAgent.ASSUME_WEBKIT', false);


/**
 * @define {boolean} Whether we know at compile-time that the browser is a
 *     mobile device running WebKit e.g. iPhone or Android.
 */
goog.define('goog.userAgent.ASSUME_MOBILE_WEBKIT', false);


/**
 * @define {boolean} Whether we know at compile-time that the browser is OPERA.
 */
goog.define('goog.userAgent.ASSUME_OPERA', false);


/**
 * @define {boolean} Whether the
 *     {@code goog.userAgent.isVersionOrHigher}
 *     function will return true for any version.
 */
goog.define('goog.userAgent.ASSUME_ANY_VERSION', false);


/**
 * Whether we know the browser engine at compile-time.
 * @type {boolean}
 * @private
 */
goog.userAgent.BROWSER_KNOWN_ =
    goog.userAgent.ASSUME_IE ||
    goog.userAgent.ASSUME_GECKO ||
    goog.userAgent.ASSUME_MOBILE_WEBKIT ||
    goog.userAgent.ASSUME_WEBKIT ||
    goog.userAgent.ASSUME_OPERA;


/**
 * Returns the userAgent string for the current browser.
 *
 * @return {string} The userAgent string.
 */
goog.userAgent.getUserAgentString = function() {
  return goog.labs.userAgent.util.getUserAgent();
};


/**
 * TODO(nnaze): Change type to "Navigator" and update compilation targets.
 * @return {Object} The native navigator object.
 */
goog.userAgent.getNavigator = function() {
  // Need a local navigator reference instead of using the global one,
  // to avoid the rare case where they reference different objects.
  // (in a WorkerPool, for example).
  return goog.global['navigator'] || null;
};


/**
 * Whether the user agent is Opera.
 * @type {boolean}
 */
goog.userAgent.OPERA = goog.userAgent.BROWSER_KNOWN_ ?
    goog.userAgent.ASSUME_OPERA :
    goog.labs.userAgent.browser.isOpera();


/**
 * Whether the user agent is Internet Explorer.
 * @type {boolean}
 */
goog.userAgent.IE = goog.userAgent.BROWSER_KNOWN_ ?
    goog.userAgent.ASSUME_IE :
    goog.labs.userAgent.browser.isIE();


/**
 * Whether the user agent is Gecko. Gecko is the rendering engine used by
 * Mozilla, Firefox, and others.
 * @type {boolean}
 */
goog.userAgent.GECKO = goog.userAgent.BROWSER_KNOWN_ ?
    goog.userAgent.ASSUME_GECKO :
    goog.labs.userAgent.engine.isGecko();


/**
 * Whether the user agent is WebKit. WebKit is the rendering engine that
 * Safari, Android and others use.
 * @type {boolean}
 */
goog.userAgent.WEBKIT = goog.userAgent.BROWSER_KNOWN_ ?
    goog.userAgent.ASSUME_WEBKIT || goog.userAgent.ASSUME_MOBILE_WEBKIT :
    goog.labs.userAgent.engine.isWebKit();


/**
 * Whether the user agent is running on a mobile device.
 *
 * This is a separate function so that the logic can be tested.
 *
 * TODO(nnaze): Investigate swapping in goog.labs.userAgent.device.isMobile().
 *
 * @return {boolean} Whether the user agent is running on a mobile device.
 * @private
 */
goog.userAgent.isMobile_ = function() {
  return goog.userAgent.WEBKIT &&
         goog.labs.userAgent.util.matchUserAgent('Mobile');
};


/**
 * Whether the user agent is running on a mobile device.
 *
 * TODO(nnaze): Consider deprecating MOBILE when labs.userAgent
 *   is promoted as the gecko/webkit logic is likely inaccurate.
 *
 * @type {boolean}
 */
goog.userAgent.MOBILE = goog.userAgent.ASSUME_MOBILE_WEBKIT ||
                        goog.userAgent.isMobile_();


/**
 * Used while transitioning code to use WEBKIT instead.
 * @type {boolean}
 * @deprecated Use {@link goog.userAgent.product.SAFARI} instead.
 * TODO(nicksantos): Delete this from goog.userAgent.
 */
goog.userAgent.SAFARI = goog.userAgent.WEBKIT;


/**
 * @return {string} the platform (operating system) the user agent is running
 *     on. Default to empty string because navigator.platform may not be defined
 *     (on Rhino, for example).
 * @private
 */
goog.userAgent.determinePlatform_ = function() {
  var navigator = goog.userAgent.getNavigator();
  return navigator && navigator.platform || '';
};


/**
 * The platform (operating system) the user agent is running on. Default to
 * empty string because navigator.platform may not be defined (on Rhino, for
 * example).
 * @type {string}
 */
goog.userAgent.PLATFORM = goog.userAgent.determinePlatform_();


/**
 * @define {boolean} Whether the user agent is running on a Macintosh operating
 *     system.
 */
goog.define('goog.userAgent.ASSUME_MAC', false);


/**
 * @define {boolean} Whether the user agent is running on a Windows operating
 *     system.
 */
goog.define('goog.userAgent.ASSUME_WINDOWS', false);


/**
 * @define {boolean} Whether the user agent is running on a Linux operating
 *     system.
 */
goog.define('goog.userAgent.ASSUME_LINUX', false);


/**
 * @define {boolean} Whether the user agent is running on a X11 windowing
 *     system.
 */
goog.define('goog.userAgent.ASSUME_X11', false);


/**
 * @define {boolean} Whether the user agent is running on Android.
 */
goog.define('goog.userAgent.ASSUME_ANDROID', false);


/**
 * @define {boolean} Whether the user agent is running on an iPhone.
 */
goog.define('goog.userAgent.ASSUME_IPHONE', false);


/**
 * @define {boolean} Whether the user agent is running on an iPad.
 */
goog.define('goog.userAgent.ASSUME_IPAD', false);


/**
 * @type {boolean}
 * @private
 */
goog.userAgent.PLATFORM_KNOWN_ =
    goog.userAgent.ASSUME_MAC ||
    goog.userAgent.ASSUME_WINDOWS ||
    goog.userAgent.ASSUME_LINUX ||
    goog.userAgent.ASSUME_X11 ||
    goog.userAgent.ASSUME_ANDROID ||
    goog.userAgent.ASSUME_IPHONE ||
    goog.userAgent.ASSUME_IPAD;


/**
 * Initialize the goog.userAgent constants that define which platform the user
 * agent is running on.
 * @private
 */
goog.userAgent.initPlatform_ = function() {
  /**
   * Whether the user agent is running on a Macintosh operating system.
   * @type {boolean}
   * @private
   */
  goog.userAgent.detectedMac_ = goog.string.contains(goog.userAgent.PLATFORM,
      'Mac');

  /**
   * Whether the user agent is running on a Windows operating system.
   * @type {boolean}
   * @private
   */
  goog.userAgent.detectedWindows_ = goog.string.contains(
      goog.userAgent.PLATFORM, 'Win');

  /**
   * Whether the user agent is running on a Linux operating system.
   * @type {boolean}
   * @private
   */
  goog.userAgent.detectedLinux_ = goog.string.contains(goog.userAgent.PLATFORM,
      'Linux');

  /**
   * Whether the user agent is running on a X11 windowing system.
   * @type {boolean}
   * @private
   */
  goog.userAgent.detectedX11_ = !!goog.userAgent.getNavigator() &&
      goog.string.contains(goog.userAgent.getNavigator()['appVersion'] || '',
          'X11');

  // Need user agent string for Android/IOS detection
  var ua = goog.userAgent.getUserAgentString();

  /**
   * Whether the user agent is running on Android.
   * @type {boolean}
   * @private
   */
  goog.userAgent.detectedAndroid_ = !!ua &&
      goog.string.contains(ua, 'Android');

  /**
   * Whether the user agent is running on an iPhone.
   * @type {boolean}
   * @private
   */
  goog.userAgent.detectedIPhone_ = !!ua && goog.string.contains(ua, 'iPhone');

  /**
   * Whether the user agent is running on an iPad.
   * @type {boolean}
   * @private
   */
  goog.userAgent.detectedIPad_ = !!ua && goog.string.contains(ua, 'iPad');
};


if (!goog.userAgent.PLATFORM_KNOWN_) {
  goog.userAgent.initPlatform_();
}


/**
 * Whether the user agent is running on a Macintosh operating system.
 * @type {boolean}
 */
goog.userAgent.MAC = goog.userAgent.PLATFORM_KNOWN_ ?
    goog.userAgent.ASSUME_MAC : goog.userAgent.detectedMac_;


/**
 * Whether the user agent is running on a Windows operating system.
 * @type {boolean}
 */
goog.userAgent.WINDOWS = goog.userAgent.PLATFORM_KNOWN_ ?
    goog.userAgent.ASSUME_WINDOWS : goog.userAgent.detectedWindows_;


/**
 * Whether the user agent is running on a Linux operating system.
 * @type {boolean}
 */
goog.userAgent.LINUX = goog.userAgent.PLATFORM_KNOWN_ ?
    goog.userAgent.ASSUME_LINUX : goog.userAgent.detectedLinux_;


/**
 * Whether the user agent is running on a X11 windowing system.
 * @type {boolean}
 */
goog.userAgent.X11 = goog.userAgent.PLATFORM_KNOWN_ ?
    goog.userAgent.ASSUME_X11 : goog.userAgent.detectedX11_;


/**
 * Whether the user agent is running on Android.
 * @type {boolean}
 */
goog.userAgent.ANDROID = goog.userAgent.PLATFORM_KNOWN_ ?
    goog.userAgent.ASSUME_ANDROID : goog.userAgent.detectedAndroid_;


/**
 * Whether the user agent is running on an iPhone.
 * @type {boolean}
 */
goog.userAgent.IPHONE = goog.userAgent.PLATFORM_KNOWN_ ?
    goog.userAgent.ASSUME_IPHONE : goog.userAgent.detectedIPhone_;


/**
 * Whether the user agent is running on an iPad.
 * @type {boolean}
 */
goog.userAgent.IPAD = goog.userAgent.PLATFORM_KNOWN_ ?
    goog.userAgent.ASSUME_IPAD : goog.userAgent.detectedIPad_;


/**
 * @return {string} The string that describes the version number of the user
 *     agent.
 * @private
 */
goog.userAgent.determineVersion_ = function() {
  // All browsers have different ways to detect the version and they all have
  // different naming schemes.

  // version is a string rather than a number because it may contain 'b', 'a',
  // and so on.
  var version = '', re;

  if (goog.userAgent.OPERA && goog.global['opera']) {
    var operaVersion = goog.global['opera'].version;
    return goog.isFunction(operaVersion) ? operaVersion() : operaVersion;
  }

  if (goog.userAgent.GECKO) {
    re = /rv\:([^\);]+)(\)|;)/;
  } else if (goog.userAgent.IE) {
    re = /\b(?:MSIE|rv)[: ]([^\);]+)(\)|;)/;
  } else if (goog.userAgent.WEBKIT) {
    // WebKit/125.4
    re = /WebKit\/(\S+)/;
  }

  if (re) {
    var arr = re.exec(goog.userAgent.getUserAgentString());
    version = arr ? arr[1] : '';
  }

  if (goog.userAgent.IE) {
    // IE9 can be in document mode 9 but be reporting an inconsistent user agent
    // version.  If it is identifying as a version lower than 9 we take the
    // documentMode as the version instead.  IE8 has similar behavior.
    // It is recommended to set the X-UA-Compatible header to ensure that IE9
    // uses documentMode 9.
    var docMode = goog.userAgent.getDocumentMode_();
    if (docMode > parseFloat(version)) {
      return String(docMode);
    }
  }

  return version;
};


/**
 * @return {number|undefined} Returns the document mode (for testing).
 * @private
 */
goog.userAgent.getDocumentMode_ = function() {
  // NOTE(user): goog.userAgent may be used in context where there is no DOM.
  var doc = goog.global['document'];
  return doc ? doc['documentMode'] : undefined;
};


/**
 * The version of the user agent. This is a string because it might contain
 * 'b' (as in beta) as well as multiple dots.
 * @type {string}
 */
goog.userAgent.VERSION = goog.userAgent.determineVersion_();


/**
 * Compares two version numbers.
 *
 * @param {string} v1 Version of first item.
 * @param {string} v2 Version of second item.
 *
 * @return {number}  1 if first argument is higher
 *                   0 if arguments are equal
 *                  -1 if second argument is higher.
 * @deprecated Use goog.string.compareVersions.
 */
goog.userAgent.compare = function(v1, v2) {
  return goog.string.compareVersions(v1, v2);
};


/**
 * Cache for {@link goog.userAgent.isVersionOrHigher}.
 * Calls to compareVersions are surprisingly expensive and, as a browser's
 * version number is unlikely to change during a session, we cache the results.
 * @const
 * @private
 */
goog.userAgent.isVersionOrHigherCache_ = {};


/**
 * Whether the user agent version is higher or the same as the given version.
 * NOTE: When checking the version numbers for Firefox and Safari, be sure to
 * use the engine's version, not the browser's version number.  For example,
 * Firefox 3.0 corresponds to Gecko 1.9 and Safari 3.0 to Webkit 522.11.
 * Opera and Internet Explorer versions match the product release number.<br>
 * @see <a href="http://en.wikipedia.org/wiki/Safari_version_history">
 *     Webkit</a>
 * @see <a href="http://en.wikipedia.org/wiki/Gecko_engine">Gecko</a>
 *
 * @param {string|number} version The version to check.
 * @return {boolean} Whether the user agent version is higher or the same as
 *     the given version.
 */
goog.userAgent.isVersionOrHigher = function(version) {
  return goog.userAgent.ASSUME_ANY_VERSION ||
      goog.userAgent.isVersionOrHigherCache_[version] ||
      (goog.userAgent.isVersionOrHigherCache_[version] =
          goog.string.compareVersions(goog.userAgent.VERSION, version) >= 0);
};


/**
 * Deprecated alias to {@code goog.userAgent.isVersionOrHigher}.
 * @param {string|number} version The version to check.
 * @return {boolean} Whether the user agent version is higher or the same as
 *     the given version.
 * @deprecated Use goog.userAgent.isVersionOrHigher().
 */
goog.userAgent.isVersion = goog.userAgent.isVersionOrHigher;


/**
 * Whether the IE effective document mode is higher or the same as the given
 * document mode version.
 * NOTE: Only for IE, return false for another browser.
 *
 * @param {number} documentMode The document mode version to check.
 * @return {boolean} Whether the IE effective document mode is higher or the
 *     same as the given version.
 */
goog.userAgent.isDocumentModeOrHigher = function(documentMode) {
  return goog.userAgent.IE && goog.userAgent.DOCUMENT_MODE >= documentMode;
};


/**
 * Deprecated alias to {@code goog.userAgent.isDocumentModeOrHigher}.
 * @param {number} version The version to check.
 * @return {boolean} Whether the IE effective document mode is higher or the
 *      same as the given version.
 * @deprecated Use goog.userAgent.isDocumentModeOrHigher().
 */
goog.userAgent.isDocumentMode = goog.userAgent.isDocumentModeOrHigher;


/**
 * For IE version < 7, documentMode is undefined, so attempt to use the
 * CSS1Compat property to see if we are in standards mode. If we are in
 * standards mode, treat the browser version as the document mode. Otherwise,
 * IE is emulating version 5.
 * @type {number|undefined}
 * @const
 */
goog.userAgent.DOCUMENT_MODE = (function() {
  var doc = goog.global['document'];
  if (!doc || !goog.userAgent.IE) {
    return undefined;
  }
  var mode = goog.userAgent.getDocumentMode_();
  return mode || (doc['compatMode'] == 'CSS1Compat' ?
      parseInt(goog.userAgent.VERSION, 10) : 5);
})();

// Copyright 2010 The Closure Library Authors. All Rights Reserved.
//
// Licensed under the Apache License, Version 2.0 (the "License");
// you may not use this file except in compliance with the License.
// You may obtain a copy of the License at
//
//      http://www.apache.org/licenses/LICENSE-2.0
//
// Unless required by applicable law or agreed to in writing, software
// distributed under the License is distributed on an "AS-IS" BASIS,
// WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
// See the License for the specific language governing permissions and
// limitations under the License.

/**
 * @fileoverview Event Types.
 *
 * @author arv@google.com (Erik Arvidsson)
 */


goog.provide('goog.events.EventType');

goog.require('goog.userAgent');


/**
 * Returns a prefixed event name for the current browser.
 * @param {string} eventName The name of the event.
 * @return {string} The prefixed event name.
 * @suppress {missingRequire|missingProvide}
 * @private
 */
goog.events.getVendorPrefixedName_ = function(eventName) {
  return goog.userAgent.WEBKIT ? 'webkit' + eventName :
      (goog.userAgent.OPERA ? 'o' + eventName.toLowerCase() :
          eventName.toLowerCase());
};


/**
 * Constants for event names.
 * @enum {string}
 */
goog.events.EventType = {
  // Mouse events
  CLICK: 'click',
  RIGHTCLICK: 'rightclick',
  DBLCLICK: 'dblclick',
  MOUSEDOWN: 'mousedown',
  MOUSEUP: 'mouseup',
  MOUSEOVER: 'mouseover',
  MOUSEOUT: 'mouseout',
  MOUSEMOVE: 'mousemove',
  MOUSEENTER: 'mouseenter',
  MOUSELEAVE: 'mouseleave',
  MOUSEWHEEL: goog.userAgent.GECKO ? 'DOMMouseScroll' : 'mousewheel',
  // Select start is non-standard.
  // See http://msdn.microsoft.com/en-us/library/ie/ms536969(v=vs.85).aspx.
  SELECTSTART: 'selectstart', // IE, Safari, Chrome

  // Wheel events
  // http://www.w3.org/TR/DOM-Level-3-Events/#events-wheelevents
  WHEEL: 'wheel',

  // Key events
  KEYPRESS: 'keypress',
  KEYDOWN: 'keydown',
  KEYUP: 'keyup',

  // Focus
  BLUR: 'blur',
  FOCUS: 'focus',
  DEACTIVATE: 'deactivate', // IE only
  // NOTE: The following two events are not stable in cross-browser usage.
  //     WebKit and Opera implement DOMFocusIn/Out.
  //     IE implements focusin/out.
  //     Gecko implements neither see bug at
  //     https://bugzilla.mozilla.org/show_bug.cgi?id=396927.
  // The DOM Events Level 3 Draft deprecates DOMFocusIn in favor of focusin:
  //     http://dev.w3.org/2006/webapi/DOM-Level-3-Events/html/DOM3-Events.html
  // You can use FOCUS in Capture phase until implementations converge.
  FOCUSIN: goog.userAgent.IE ? 'focusin' : 'DOMFocusIn',
  FOCUSOUT: goog.userAgent.IE ? 'focusout' : 'DOMFocusOut',

  // Forms
  CHANGE: 'change',
  SELECT: 'select',
  SUBMIT: 'submit',
  INPUT: 'input',
  PROPERTYCHANGE: 'propertychange', // IE only

  // Drag and drop
  DRAGSTART: 'dragstart',
  DRAG: 'drag',
  DRAGENTER: 'dragenter',
  DRAGOVER: 'dragover',
  DRAGLEAVE: 'dragleave',
  DROP: 'drop',
  DRAGEND: 'dragend',

  // Touch events
  // Note that other touch events exist, but we should follow the W3C list here.
  // http://www.w3.org/TR/touch-events/#list-of-touchevent-types
  TOUCHSTART: 'touchstart',
  TOUCHMOVE: 'touchmove',
  TOUCHEND: 'touchend',
  TOUCHCANCEL: 'touchcancel',

  // Misc
  BEFOREUNLOAD: 'beforeunload',
  CONSOLEMESSAGE: 'consolemessage',
  CONTEXTMENU: 'contextmenu',
  DOMCONTENTLOADED: 'DOMContentLoaded',
  ERROR: 'error',
  HELP: 'help',
  LOAD: 'load',
  LOSECAPTURE: 'losecapture',
  ORIENTATIONCHANGE: 'orientationchange',
  READYSTATECHANGE: 'readystatechange',
  RESIZE: 'resize',
  SCROLL: 'scroll',
  UNLOAD: 'unload',

  // HTML 5 History events
  // See http://www.w3.org/TR/html5/history.html#event-definitions
  HASHCHANGE: 'hashchange',
  PAGEHIDE: 'pagehide',
  PAGESHOW: 'pageshow',
  POPSTATE: 'popstate',

  // Copy and Paste
  // Support is limited. Make sure it works on your favorite browser
  // before using.
  // http://www.quirksmode.org/dom/events/cutcopypaste.html
  COPY: 'copy',
  PASTE: 'paste',
  CUT: 'cut',
  BEFORECOPY: 'beforecopy',
  BEFORECUT: 'beforecut',
  BEFOREPASTE: 'beforepaste',

  // HTML5 online/offline events.
  // http://www.w3.org/TR/offline-webapps/#related
  ONLINE: 'online',
  OFFLINE: 'offline',

  // HTML 5 worker events
  MESSAGE: 'message',
  CONNECT: 'connect',

  // CSS animation events.
  /** @suppress {missingRequire} */
  ANIMATIONSTART: goog.events.getVendorPrefixedName_('AnimationStart'),
  /** @suppress {missingRequire} */
  ANIMATIONEND: goog.events.getVendorPrefixedName_('AnimationEnd'),
  /** @suppress {missingRequire} */
  ANIMATIONITERATION: goog.events.getVendorPrefixedName_('AnimationIteration'),

  // CSS transition events. Based on the browser support described at:
  // https://developer.mozilla.org/en/css/css_transitions#Browser_compatibility
  /** @suppress {missingRequire} */
  TRANSITIONEND: goog.events.getVendorPrefixedName_('TransitionEnd'),

  // W3C Pointer Events
  // http://www.w3.org/TR/pointerevents/
  POINTERDOWN: 'pointerdown',
  POINTERUP: 'pointerup',
  POINTERCANCEL: 'pointercancel',
  POINTERMOVE: 'pointermove',
  POINTEROVER: 'pointerover',
  POINTEROUT: 'pointerout',
  POINTERENTER: 'pointerenter',
  POINTERLEAVE: 'pointerleave',
  GOTPOINTERCAPTURE: 'gotpointercapture',
  LOSTPOINTERCAPTURE: 'lostpointercapture',

  // IE specific events.
  // See http://msdn.microsoft.com/en-us/library/ie/hh772103(v=vs.85).aspx
  // Note: these events will be supplanted in IE11.
  MSGESTURECHANGE: 'MSGestureChange',
  MSGESTUREEND: 'MSGestureEnd',
  MSGESTUREHOLD: 'MSGestureHold',
  MSGESTURESTART: 'MSGestureStart',
  MSGESTURETAP: 'MSGestureTap',
  MSGOTPOINTERCAPTURE: 'MSGotPointerCapture',
  MSINERTIASTART: 'MSInertiaStart',
  MSLOSTPOINTERCAPTURE: 'MSLostPointerCapture',
  MSPOINTERCANCEL: 'MSPointerCancel',
  MSPOINTERDOWN: 'MSPointerDown',
  MSPOINTERENTER: 'MSPointerEnter',
  MSPOINTERHOVER: 'MSPointerHover',
  MSPOINTERLEAVE: 'MSPointerLeave',
  MSPOINTERMOVE: 'MSPointerMove',
  MSPOINTEROUT: 'MSPointerOut',
  MSPOINTEROVER: 'MSPointerOver',
  MSPOINTERUP: 'MSPointerUp',

  // Native IMEs/input tools events.
  TEXTINPUT: 'textinput',
  COMPOSITIONSTART: 'compositionstart',
  COMPOSITIONUPDATE: 'compositionupdate',
  COMPOSITIONEND: 'compositionend',

  // Webview tag events
  // See http://developer.chrome.com/dev/apps/webview_tag.html
  EXIT: 'exit',
  LOADABORT: 'loadabort',
  LOADCOMMIT: 'loadcommit',
  LOADREDIRECT: 'loadredirect',
  LOADSTART: 'loadstart',
  LOADSTOP: 'loadstop',
  RESPONSIVE: 'responsive',
  SIZECHANGED: 'sizechanged',
  UNRESPONSIVE: 'unresponsive',

  // HTML5 Page Visibility API.  See details at
  // {@code goog.labs.dom.PageVisibilityMonitor}.
  VISIBILITYCHANGE: 'visibilitychange',

  // LocalStorage event.
  STORAGE: 'storage',

  // DOM Level 2 mutation events (deprecated).
  DOMSUBTREEMODIFIED: 'DOMSubtreeModified',
  DOMNODEINSERTED: 'DOMNodeInserted',
  DOMNODEREMOVED: 'DOMNodeRemoved',
  DOMNODEREMOVEDFROMDOCUMENT: 'DOMNodeRemovedFromDocument',
  DOMNODEINSERTEDINTODOCUMENT: 'DOMNodeInsertedIntoDocument',
  DOMATTRMODIFIED: 'DOMAttrModified',
  DOMCHARACTERDATAMODIFIED: 'DOMCharacterDataModified'
};

// Copyright 2010 The Closure Library Authors. All Rights Reserved.
//
// Licensed under the Apache License, Version 2.0 (the "License");
// you may not use this file except in compliance with the License.
// You may obtain a copy of the License at
//
//      http://www.apache.org/licenses/LICENSE-2.0
//
// Unless required by applicable law or agreed to in writing, software
// distributed under the License is distributed on an "AS-IS" BASIS,
// WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
// See the License for the specific language governing permissions and
// limitations under the License.

/**
 * @fileoverview Browser capability checks for the events package.
 *
 */


goog.provide('goog.events.BrowserFeature');

goog.require('goog.userAgent');


/**
 * Enum of browser capabilities.
 * @enum {boolean}
 */
goog.events.BrowserFeature = {
  /**
   * Whether the button attribute of the event is W3C compliant.  False in
   * Internet Explorer prior to version 9; document-version dependent.
   */
  HAS_W3C_BUTTON: !goog.userAgent.IE ||
      goog.userAgent.isDocumentModeOrHigher(9),

  /**
   * Whether the browser supports full W3C event model.
   */
  HAS_W3C_EVENT_SUPPORT: !goog.userAgent.IE ||
      goog.userAgent.isDocumentModeOrHigher(9),

  /**
   * To prevent default in IE7-8 for certain keydown events we need set the
   * keyCode to -1.
   */
  SET_KEY_CODE_TO_PREVENT_DEFAULT: goog.userAgent.IE &&
      !goog.userAgent.isVersionOrHigher('9'),

  /**
   * Whether the {@code navigator.onLine} property is supported.
   */
  HAS_NAVIGATOR_ONLINE_PROPERTY: !goog.userAgent.WEBKIT ||
      goog.userAgent.isVersionOrHigher('528'),

  /**
   * Whether HTML5 network online/offline events are supported.
   */
  HAS_HTML5_NETWORK_EVENT_SUPPORT:
      goog.userAgent.GECKO && goog.userAgent.isVersionOrHigher('1.9b') ||
      goog.userAgent.IE && goog.userAgent.isVersionOrHigher('8') ||
      goog.userAgent.OPERA && goog.userAgent.isVersionOrHigher('9.5') ||
      goog.userAgent.WEBKIT && goog.userAgent.isVersionOrHigher('528'),

  /**
   * Whether HTML5 network events fire on document.body, or otherwise the
   * window.
   */
  HTML5_NETWORK_EVENTS_FIRE_ON_BODY:
      goog.userAgent.GECKO && !goog.userAgent.isVersionOrHigher('8') ||
      goog.userAgent.IE && !goog.userAgent.isVersionOrHigher('9'),

  /**
   * Whether touch is enabled in the browser.
   */
  TOUCH_ENABLED:
      ('ontouchstart' in goog.global ||
          !!(goog.global['document'] &&
             document.documentElement &&
             'ontouchstart' in document.documentElement) ||
          // IE10 uses non-standard touch events, so it has a different check.
          !!(goog.global['navigator'] &&
              goog.global['navigator']['msMaxTouchPoints']))
};

// Copyright 2005 The Closure Library Authors. All Rights Reserved.
//
// Licensed under the Apache License, Version 2.0 (the "License");
// you may not use this file except in compliance with the License.
// You may obtain a copy of the License at
//
//      http://www.apache.org/licenses/LICENSE-2.0
//
// Unless required by applicable law or agreed to in writing, software
// distributed under the License is distributed on an "AS-IS" BASIS,
// WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
// See the License for the specific language governing permissions and
// limitations under the License.

/**
 * @fileoverview A patched, standardized event object for browser events.
 *
 * <pre>
 * The patched event object contains the following members:
 * - type           {string}    Event type, e.g. 'click'
 * - target         {Object}    The element that actually triggered the event
 * - currentTarget  {Object}    The element the listener is attached to
 * - relatedTarget  {Object}    For mouseover and mouseout, the previous object
 * - offsetX        {number}    X-coordinate relative to target
 * - offsetY        {number}    Y-coordinate relative to target
 * - clientX        {number}    X-coordinate relative to viewport
 * - clientY        {number}    Y-coordinate relative to viewport
 * - screenX        {number}    X-coordinate relative to the edge of the screen
 * - screenY        {number}    Y-coordinate relative to the edge of the screen
 * - button         {number}    Mouse button. Use isButton() to test.
 * - keyCode        {number}    Key-code
 * - ctrlKey        {boolean}   Was ctrl key depressed
 * - altKey         {boolean}   Was alt key depressed
 * - shiftKey       {boolean}   Was shift key depressed
 * - metaKey        {boolean}   Was meta key depressed
 * - defaultPrevented {boolean} Whether the default action has been prevented
 * - state          {Object}    History state object
 *
 * NOTE: The keyCode member contains the raw browser keyCode. For normalized
 * key and character code use {@link goog.events.KeyHandler}.
 * </pre>
 *
 * @author arv@google.com (Erik Arvidsson)
 */

goog.provide('goog.events.BrowserEvent');
goog.provide('goog.events.BrowserEvent.MouseButton');

goog.require('goog.events.BrowserFeature');
goog.require('goog.events.Event');
goog.require('goog.events.EventType');
goog.require('goog.reflect');
goog.require('goog.userAgent');



/**
 * Accepts a browser event object and creates a patched, cross browser event
 * object.
 * The content of this object will not be initialized if no event object is
 * provided. If this is the case, init() needs to be invoked separately.
 * @param {Event=} opt_e Browser event object.
 * @param {EventTarget=} opt_currentTarget Current target for event.
 * @constructor
 * @extends {goog.events.Event}
 */
goog.events.BrowserEvent = function(opt_e, opt_currentTarget) {
  goog.events.BrowserEvent.base(this, 'constructor', opt_e ? opt_e.type : '');

  /**
   * Target that fired the event.
   * @override
   * @type {Node}
   */
  this.target = null;

  /**
   * Node that had the listener attached.
   * @override
   * @type {Node|undefined}
   */
  this.currentTarget = null;

  /**
   * For mouseover and mouseout events, the related object for the event.
   * @type {Node}
   */
  this.relatedTarget = null;

  /**
   * X-coordinate relative to target.
   * @type {number}
   */
  this.offsetX = 0;

  /**
   * Y-coordinate relative to target.
   * @type {number}
   */
  this.offsetY = 0;

  /**
   * X-coordinate relative to the window.
   * @type {number}
   */
  this.clientX = 0;

  /**
   * Y-coordinate relative to the window.
   * @type {number}
   */
  this.clientY = 0;

  /**
   * X-coordinate relative to the monitor.
   * @type {number}
   */
  this.screenX = 0;

  /**
   * Y-coordinate relative to the monitor.
   * @type {number}
   */
  this.screenY = 0;

  /**
   * Which mouse button was pressed.
   * @type {number}
   */
  this.button = 0;

  /**
   * Keycode of key press.
   * @type {number}
   */
  this.keyCode = 0;

  /**
   * Keycode of key press.
   * @type {number}
   */
  this.charCode = 0;

  /**
   * Whether control was pressed at time of event.
   * @type {boolean}
   */
  this.ctrlKey = false;

  /**
   * Whether alt was pressed at time of event.
   * @type {boolean}
   */
  this.altKey = false;

  /**
   * Whether shift was pressed at time of event.
   * @type {boolean}
   */
  this.shiftKey = false;

  /**
   * Whether the meta key was pressed at time of event.
   * @type {boolean}
   */
  this.metaKey = false;

  /**
   * History state object, only set for PopState events where it's a copy of the
   * state object provided to pushState or replaceState.
   * @type {Object}
   */
  this.state = null;

  /**
   * Whether the default platform modifier key was pressed at time of event.
   * (This is control for all platforms except Mac, where it's Meta.)
   * @type {boolean}
   */
  this.platformModifierKey = false;

  /**
   * The browser event object.
   * @private {Event}
   */
  this.event_ = null;

  if (opt_e) {
    this.init(opt_e, opt_currentTarget);
  }
};
goog.inherits(goog.events.BrowserEvent, goog.events.Event);


/**
 * Normalized button constants for the mouse.
 * @enum {number}
 */
goog.events.BrowserEvent.MouseButton = {
  LEFT: 0,
  MIDDLE: 1,
  RIGHT: 2
};


/**
 * Static data for mapping mouse buttons.
 * @type {!Array.<number>}
 */
goog.events.BrowserEvent.IEButtonMap = [
  1, // LEFT
  4, // MIDDLE
  2  // RIGHT
];


/**
 * Accepts a browser event object and creates a patched, cross browser event
 * object.
 * @param {Event} e Browser event object.
 * @param {EventTarget=} opt_currentTarget Current target for event.
 */
goog.events.BrowserEvent.prototype.init = function(e, opt_currentTarget) {
  var type = this.type = e.type;

  // TODO(nicksantos): Change this.target to type EventTarget.
  this.target = /** @type {Node} */ (e.target) || e.srcElement;

  // TODO(nicksantos): Change this.currentTarget to type EventTarget.
  this.currentTarget = /** @type {Node} */ (opt_currentTarget);

  var relatedTarget = /** @type {Node} */ (e.relatedTarget);
  if (relatedTarget) {
    // There's a bug in FireFox where sometimes, relatedTarget will be a
    // chrome element, and accessing any property of it will get a permission
    // denied exception. See:
    // https://bugzilla.mozilla.org/show_bug.cgi?id=497780
    if (goog.userAgent.GECKO) {
      if (!goog.reflect.canAccessProperty(relatedTarget, 'nodeName')) {
        relatedTarget = null;
      }
    }
    // TODO(arv): Use goog.events.EventType when it has been refactored into its
    // own file.
  } else if (type == goog.events.EventType.MOUSEOVER) {
    relatedTarget = e.fromElement;
  } else if (type == goog.events.EventType.MOUSEOUT) {
    relatedTarget = e.toElement;
  }

  this.relatedTarget = relatedTarget;

  // Webkit emits a lame warning whenever layerX/layerY is accessed.
  // http://code.google.com/p/chromium/issues/detail?id=101733
  this.offsetX = (goog.userAgent.WEBKIT || e.offsetX !== undefined) ?
      e.offsetX : e.layerX;
  this.offsetY = (goog.userAgent.WEBKIT || e.offsetY !== undefined) ?
      e.offsetY : e.layerY;

  this.clientX = e.clientX !== undefined ? e.clientX : e.pageX;
  this.clientY = e.clientY !== undefined ? e.clientY : e.pageY;
  this.screenX = e.screenX || 0;
  this.screenY = e.screenY || 0;

  this.button = e.button;

  this.keyCode = e.keyCode || 0;
  this.charCode = e.charCode || (type == 'keypress' ? e.keyCode : 0);
  this.ctrlKey = e.ctrlKey;
  this.altKey = e.altKey;
  this.shiftKey = e.shiftKey;
  this.metaKey = e.metaKey;
  this.platformModifierKey = goog.userAgent.MAC ? e.metaKey : e.ctrlKey;
  this.state = e.state;
  this.event_ = e;
  if (e.defaultPrevented) {
    this.preventDefault();
  }
};


/**
 * Tests to see which button was pressed during the event. This is really only
 * useful in IE and Gecko browsers. And in IE, it's only useful for
 * mousedown/mouseup events, because click only fires for the left mouse button.
 *
 * Safari 2 only reports the left button being clicked, and uses the value '1'
 * instead of 0. Opera only reports a mousedown event for the middle button, and
 * no mouse events for the right button. Opera has default behavior for left and
 * middle click that can only be overridden via a configuration setting.
 *
 * There's a nice table of this mess at http://www.unixpapa.com/js/mouse.html.
 *
 * @param {goog.events.BrowserEvent.MouseButton} button The button
 *     to test for.
 * @return {boolean} True if button was pressed.
 */
goog.events.BrowserEvent.prototype.isButton = function(button) {
  if (!goog.events.BrowserFeature.HAS_W3C_BUTTON) {
    if (this.type == 'click') {
      return button == goog.events.BrowserEvent.MouseButton.LEFT;
    } else {
      return !!(this.event_.button &
          goog.events.BrowserEvent.IEButtonMap[button]);
    }
  } else {
    return this.event_.button == button;
  }
};


/**
 * Whether this has an "action"-producing mouse button.
 *
 * By definition, this includes left-click on windows/linux, and left-click
 * without the ctrl key on Macs.
 *
 * @return {boolean} The result.
 */
goog.events.BrowserEvent.prototype.isMouseActionButton = function() {
  // Webkit does not ctrl+click to be a right-click, so we
  // normalize it to behave like Gecko and Opera.
  return this.isButton(goog.events.BrowserEvent.MouseButton.LEFT) &&
      !(goog.userAgent.WEBKIT && goog.userAgent.MAC && this.ctrlKey);
};


/**
 * @override
 */
goog.events.BrowserEvent.prototype.stopPropagation = function() {
  goog.events.BrowserEvent.superClass_.stopPropagation.call(this);
  if (this.event_.stopPropagation) {
    this.event_.stopPropagation();
  } else {
    this.event_.cancelBubble = true;
  }
};


/**
 * @override
 */
goog.events.BrowserEvent.prototype.preventDefault = function() {
  goog.events.BrowserEvent.superClass_.preventDefault.call(this);
  var be = this.event_;
  if (!be.preventDefault) {
    be.returnValue = false;
    if (goog.events.BrowserFeature.SET_KEY_CODE_TO_PREVENT_DEFAULT) {
      /** @preserveTry */
      try {
        // Most keys can be prevented using returnValue. Some special keys
        // require setting the keyCode to -1 as well:
        //
        // In IE7:
        // F3, F5, F10, F11, Ctrl+P, Crtl+O, Ctrl+F (these are taken from IE6)
        //
        // In IE8:
        // Ctrl+P, Crtl+O, Ctrl+F (F1-F12 cannot be stopped through the event)
        //
        // We therefore do this for all function keys as well as when Ctrl key
        // is pressed.
        var VK_F1 = 112;
        var VK_F12 = 123;
        if (be.ctrlKey || be.keyCode >= VK_F1 && be.keyCode <= VK_F12) {
          be.keyCode = -1;
        }
      } catch (ex) {
        // IE throws an 'access denied' exception when trying to change
        // keyCode in some situations (e.g. srcElement is input[type=file],
        // or srcElement is an anchor tag rewritten by parent's innerHTML).
        // Do nothing in this case.
      }
    }
  } else {
    be.preventDefault();
  }
};


/**
 * @return {Event} The underlying browser event object.
 */
goog.events.BrowserEvent.prototype.getBrowserEvent = function() {
  return this.event_;
};


/** @override */
goog.events.BrowserEvent.prototype.disposeInternal = function() {
};

// Copyright 2010 The Closure Library Authors. All Rights Reserved.
//
// Licensed under the Apache License, Version 2.0 (the "License");
// you may not use this file except in compliance with the License.
// You may obtain a copy of the License at
//
//      http://www.apache.org/licenses/LICENSE-2.0
//
// Unless required by applicable law or agreed to in writing, software
// distributed under the License is distributed on an "AS-IS" BASIS,
// WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
// See the License for the specific language governing permissions and
// limitations under the License.

/**
 * @fileoverview A global registry for entry points into a program,
 * so that they can be instrumented. Each module should register their
 * entry points with this registry. Designed to be compiled out
 * if no instrumentation is requested.
 *
 * Entry points may be registered before or after a call to
 * goog.debug.entryPointRegistry.monitorAll. If an entry point is registered
 * later, the existing monitor will instrument the new entry point.
 *
 * @author nicksantos@google.com (Nick Santos)
 */

goog.provide('goog.debug.EntryPointMonitor');
goog.provide('goog.debug.entryPointRegistry');

goog.require('goog.asserts');



/**
 * @interface
 */
goog.debug.EntryPointMonitor = function() {};


/**
 * Instruments a function.
 *
 * @param {!Function} fn A function to instrument.
 * @return {!Function} The instrumented function.
 */
goog.debug.EntryPointMonitor.prototype.wrap;


/**
 * Try to remove an instrumentation wrapper created by this monitor.
 * If the function passed to unwrap is not a wrapper created by this
 * monitor, then we will do nothing.
 *
 * Notice that some wrappers may not be unwrappable. For example, if other
 * monitors have applied their own wrappers, then it will be impossible to
 * unwrap them because their wrappers will have captured our wrapper.
 *
 * So it is important that entry points are unwrapped in the reverse
 * order that they were wrapped.
 *
 * @param {!Function} fn A function to unwrap.
 * @return {!Function} The unwrapped function, or {@code fn} if it was not
 *     a wrapped function created by this monitor.
 */
goog.debug.EntryPointMonitor.prototype.unwrap;


/**
 * An array of entry point callbacks.
 * @type {!Array.<function(!Function)>}
 * @private
 */
goog.debug.entryPointRegistry.refList_ = [];


/**
 * Monitors that should wrap all the entry points.
 * @type {!Array.<!goog.debug.EntryPointMonitor>}
 * @private
 */
goog.debug.entryPointRegistry.monitors_ = [];


/**
 * Whether goog.debug.entryPointRegistry.monitorAll has ever been called.
 * Checking this allows the compiler to optimize out the registrations.
 * @type {boolean}
 * @private
 */
goog.debug.entryPointRegistry.monitorsMayExist_ = false;


/**
 * Register an entry point with this module.
 *
 * The entry point will be instrumented when a monitor is passed to
 * goog.debug.entryPointRegistry.monitorAll. If this has already occurred, the
 * entry point is instrumented immediately.
 *
 * @param {function(!Function)} callback A callback function which is called
 *     with a transforming function to instrument the entry point. The callback
 *     is responsible for wrapping the relevant entry point with the
 *     transforming function.
 */
goog.debug.entryPointRegistry.register = function(callback) {
  // Don't use push(), so that this can be compiled out.
  goog.debug.entryPointRegistry.refList_[
      goog.debug.entryPointRegistry.refList_.length] = callback;
  // If no one calls monitorAll, this can be compiled out.
  if (goog.debug.entryPointRegistry.monitorsMayExist_) {
    var monitors = goog.debug.entryPointRegistry.monitors_;
    for (var i = 0; i < monitors.length; i++) {
      callback(goog.bind(monitors[i].wrap, monitors[i]));
    }
  }
};


/**
 * Configures a monitor to wrap all entry points.
 *
 * Entry points that have already been registered are immediately wrapped by
 * the monitor. When an entry point is registered in the future, it will also
 * be wrapped by the monitor when it is registered.
 *
 * @param {!goog.debug.EntryPointMonitor} monitor An entry point monitor.
 */
goog.debug.entryPointRegistry.monitorAll = function(monitor) {
  goog.debug.entryPointRegistry.monitorsMayExist_ = true;
  var transformer = goog.bind(monitor.wrap, monitor);
  for (var i = 0; i < goog.debug.entryPointRegistry.refList_.length; i++) {
    goog.debug.entryPointRegistry.refList_[i](transformer);
  }
  goog.debug.entryPointRegistry.monitors_.push(monitor);
};


/**
 * Try to unmonitor all the entry points that have already been registered. If
 * an entry point is registered in the future, it will not be wrapped by the
 * monitor when it is registered. Note that this may fail if the entry points
 * have additional wrapping.
 *
 * @param {!goog.debug.EntryPointMonitor} monitor The last monitor to wrap
 *     the entry points.
 * @throws {Error} If the monitor is not the most recently configured monitor.
 */
goog.debug.entryPointRegistry.unmonitorAllIfPossible = function(monitor) {
  var monitors = goog.debug.entryPointRegistry.monitors_;
  goog.asserts.assert(monitor == monitors[monitors.length - 1],
      'Only the most recent monitor can be unwrapped.');
  var transformer = goog.bind(monitor.unwrap, monitor);
  for (var i = 0; i < goog.debug.entryPointRegistry.refList_.length; i++) {
    goog.debug.entryPointRegistry.refList_[i](transformer);
  }
  monitors.length--;
};

// Copyright 2012 The Closure Library Authors. All Rights Reserved.
//
// Licensed under the Apache License, Version 2.0 (the "License");
// you may not use this file except in compliance with the License.
// You may obtain a copy of the License at
//
//      http://www.apache.org/licenses/LICENSE-2.0
//
// Unless required by applicable law or agreed to in writing, software
// distributed under the License is distributed on an "AS-IS" BASIS,
// WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
// See the License for the specific language governing permissions and
// limitations under the License.

/**
 * @fileoverview An interface for a listenable JavaScript object.
 * @author chrishenry@google.com (Chris Henry)
 */

goog.provide('goog.events.Listenable');
goog.provide('goog.events.ListenableKey');

/** @suppress {extraRequire} */
goog.require('goog.events.EventId');



/**
 * A listenable interface. A listenable is an object with the ability
 * to dispatch/broadcast events to "event listeners" registered via
 * listen/listenOnce.
 *
 * The interface allows for an event propagation mechanism similar
 * to one offered by native browser event targets, such as
 * capture/bubble mechanism, stopping propagation, and preventing
 * default actions. Capture/bubble mechanism depends on the ancestor
 * tree constructed via {@code #getParentEventTarget}; this tree
 * must be directed acyclic graph. The meaning of default action(s)
 * in preventDefault is specific to a particular use case.
 *
 * Implementations that do not support capture/bubble or can not have
 * a parent listenable can simply not implement any ability to set the
 * parent listenable (and have {@code #getParentEventTarget} return
 * null).
 *
 * Implementation of this class can be used with or independently from
 * goog.events.
 *
 * Implementation must call {@code #addImplementation(implClass)}.
 *
 * @interface
 * @see goog.events
 * @see http://www.w3.org/TR/DOM-Level-2-Events/events.html
 */
goog.events.Listenable = function() {};


/**
 * An expando property to indicate that an object implements
 * goog.events.Listenable.
 *
 * See addImplementation/isImplementedBy.
 *
 * @type {string}
 * @const
 */
goog.events.Listenable.IMPLEMENTED_BY_PROP =
    'closure_listenable_' + ((Math.random() * 1e6) | 0);


/**
 * Marks a given class (constructor) as an implementation of
 * Listenable, do that we can query that fact at runtime. The class
 * must have already implemented the interface.
 * @param {!Function} cls The class constructor. The corresponding
 *     class must have already implemented the interface.
 */
goog.events.Listenable.addImplementation = function(cls) {
  cls.prototype[goog.events.Listenable.IMPLEMENTED_BY_PROP] = true;
};


/**
 * @param {Object} obj The object to check.
 * @return {boolean} Whether a given instance implements Listenable. The
 *     class/superclass of the instance must call addImplementation.
 */
goog.events.Listenable.isImplementedBy = function(obj) {
  return !!(obj && obj[goog.events.Listenable.IMPLEMENTED_BY_PROP]);
};


/**
 * Adds an event listener. A listener can only be added once to an
 * object and if it is added again the key for the listener is
 * returned. Note that if the existing listener is a one-off listener
 * (registered via listenOnce), it will no longer be a one-off
 * listener after a call to listen().
 *
 * @param {string|!goog.events.EventId.<EVENTOBJ>} type The event type id.
 * @param {function(this:SCOPE, EVENTOBJ):(boolean|undefined)} listener Callback
 *     method.
 * @param {boolean=} opt_useCapture Whether to fire in capture phase
 *     (defaults to false).
 * @param {SCOPE=} opt_listenerScope Object in whose scope to call the
 *     listener.
 * @return {goog.events.ListenableKey} Unique key for the listener.
 * @template SCOPE,EVENTOBJ
 */
goog.events.Listenable.prototype.listen;


/**
 * Adds an event listener that is removed automatically after the
 * listener fired once.
 *
 * If an existing listener already exists, listenOnce will do
 * nothing. In particular, if the listener was previously registered
 * via listen(), listenOnce() will not turn the listener into a
 * one-off listener. Similarly, if there is already an existing
 * one-off listener, listenOnce does not modify the listeners (it is
 * still a once listener).
 *
 * @param {string|!goog.events.EventId.<EVENTOBJ>} type The event type id.
 * @param {function(this:SCOPE, EVENTOBJ):(boolean|undefined)} listener Callback
 *     method.
 * @param {boolean=} opt_useCapture Whether to fire in capture phase
 *     (defaults to false).
 * @param {SCOPE=} opt_listenerScope Object in whose scope to call the
 *     listener.
 * @return {goog.events.ListenableKey} Unique key for the listener.
 * @template SCOPE,EVENTOBJ
 */
goog.events.Listenable.prototype.listenOnce;


/**
 * Removes an event listener which was added with listen() or listenOnce().
 *
 * @param {string|!goog.events.EventId.<EVENTOBJ>} type The event type id.
 * @param {function(this:SCOPE, EVENTOBJ):(boolean|undefined)} listener Callback
 *     method.
 * @param {boolean=} opt_useCapture Whether to fire in capture phase
 *     (defaults to false).
 * @param {SCOPE=} opt_listenerScope Object in whose scope to call
 *     the listener.
 * @return {boolean} Whether any listener was removed.
 * @template SCOPE,EVENTOBJ
 */
goog.events.Listenable.prototype.unlisten;


/**
 * Removes an event listener which was added with listen() by the key
 * returned by listen().
 *
 * @param {goog.events.ListenableKey} key The key returned by
 *     listen() or listenOnce().
 * @return {boolean} Whether any listener was removed.
 */
goog.events.Listenable.prototype.unlistenByKey;


/**
 * Dispatches an event (or event like object) and calls all listeners
 * listening for events of this type. The type of the event is decided by the
 * type property on the event object.
 *
 * If any of the listeners returns false OR calls preventDefault then this
 * function will return false.  If one of the capture listeners calls
 * stopPropagation, then the bubble listeners won't fire.
 *
 * @param {goog.events.EventLike} e Event object.
 * @return {boolean} If anyone called preventDefault on the event object (or
 *     if any of the listeners returns false) this will also return false.
 */
goog.events.Listenable.prototype.dispatchEvent;


/**
 * Removes all listeners from this listenable. If type is specified,
 * it will only remove listeners of the particular type. otherwise all
 * registered listeners will be removed.
 *
 * @param {string=} opt_type Type of event to remove, default is to
 *     remove all types.
 * @return {number} Number of listeners removed.
 */
goog.events.Listenable.prototype.removeAllListeners;


/**
 * Returns the parent of this event target to use for capture/bubble
 * mechanism.
 *
 * NOTE(chrishenry): The name reflects the original implementation of
 * custom event target ({@code goog.events.EventTarget}). We decided
 * that changing the name is not worth it.
 *
 * @return {goog.events.Listenable} The parent EventTarget or null if
 *     there is no parent.
 */
goog.events.Listenable.prototype.getParentEventTarget;


/**
 * Fires all registered listeners in this listenable for the given
 * type and capture mode, passing them the given eventObject. This
 * does not perform actual capture/bubble. Only implementors of the
 * interface should be using this.
 *
 * @param {string|!goog.events.EventId.<EVENTOBJ>} type The type of the
 *     listeners to fire.
 * @param {boolean} capture The capture mode of the listeners to fire.
 * @param {EVENTOBJ} eventObject The event object to fire.
 * @return {boolean} Whether all listeners succeeded without
 *     attempting to prevent default behavior. If any listener returns
 *     false or called goog.events.Event#preventDefault, this returns
 *     false.
 * @template EVENTOBJ
 */
goog.events.Listenable.prototype.fireListeners;


/**
 * Gets all listeners in this listenable for the given type and
 * capture mode.
 *
 * @param {string|!goog.events.EventId} type The type of the listeners to fire.
 * @param {boolean} capture The capture mode of the listeners to fire.
 * @return {!Array.<goog.events.ListenableKey>} An array of registered
 *     listeners.
 * @template EVENTOBJ
 */
goog.events.Listenable.prototype.getListeners;


/**
 * Gets the goog.events.ListenableKey for the event or null if no such
 * listener is in use.
 *
 * @param {string|!goog.events.EventId.<EVENTOBJ>} type The name of the event
 *     without the 'on' prefix.
 * @param {function(this:SCOPE, EVENTOBJ):(boolean|undefined)} listener The
 *     listener function to get.
 * @param {boolean} capture Whether the listener is a capturing listener.
 * @param {SCOPE=} opt_listenerScope Object in whose scope to call the
 *     listener.
 * @return {goog.events.ListenableKey} the found listener or null if not found.
 * @template SCOPE,EVENTOBJ
 */
goog.events.Listenable.prototype.getListener;


/**
 * Whether there is any active listeners matching the specified
 * signature. If either the type or capture parameters are
 * unspecified, the function will match on the remaining criteria.
 *
 * @param {string|!goog.events.EventId.<EVENTOBJ>=} opt_type Event type.
 * @param {boolean=} opt_capture Whether to check for capture or bubble
 *     listeners.
 * @return {boolean} Whether there is any active listeners matching
 *     the requested type and/or capture phase.
 * @template EVENTOBJ
 */
goog.events.Listenable.prototype.hasListener;



/**
 * An interface that describes a single registered listener.
 * @interface
 */
goog.events.ListenableKey = function() {};


/**
 * Counter used to create a unique key
 * @type {number}
 * @private
 */
goog.events.ListenableKey.counter_ = 0;


/**
 * Reserves a key to be used for ListenableKey#key field.
 * @return {number} A number to be used to fill ListenableKey#key
 *     field.
 */
goog.events.ListenableKey.reserveKey = function() {
  return ++goog.events.ListenableKey.counter_;
};


/**
 * The source event target.
 * @type {!(Object|goog.events.Listenable|goog.events.EventTarget)}
 */
goog.events.ListenableKey.prototype.src;


/**
 * The event type the listener is listening to.
 * @type {string}
 */
goog.events.ListenableKey.prototype.type;


/**
 * The listener function.
 * @type {function(?):?|{handleEvent:function(?):?}|null}
 */
goog.events.ListenableKey.prototype.listener;


/**
 * Whether the listener works on capture phase.
 * @type {boolean}
 */
goog.events.ListenableKey.prototype.capture;


/**
 * The 'this' object for the listener function's scope.
 * @type {Object}
 */
goog.events.ListenableKey.prototype.handler;


/**
 * A globally unique number to identify the key.
 * @type {number}
 */
goog.events.ListenableKey.prototype.key;

// Copyright 2005 The Closure Library Authors. All Rights Reserved.
//
// Licensed under the Apache License, Version 2.0 (the "License");
// you may not use this file except in compliance with the License.
// You may obtain a copy of the License at
//
//      http://www.apache.org/licenses/LICENSE-2.0
//
// Unless required by applicable law or agreed to in writing, software
// distributed under the License is distributed on an "AS-IS" BASIS,
// WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
// See the License for the specific language governing permissions and
// limitations under the License.

/**
 * @fileoverview Listener object.
 * @see ../demos/events.html
 */

goog.provide('goog.events.Listener');

goog.require('goog.events.ListenableKey');



/**
 * Simple class that stores information about a listener
 * @param {!Function} listener Callback function.
 * @param {Function} proxy Wrapper for the listener that patches the event.
 * @param {EventTarget|goog.events.Listenable} src Source object for
 *     the event.
 * @param {string} type Event type.
 * @param {boolean} capture Whether in capture or bubble phase.
 * @param {Object=} opt_handler Object in whose context to execute the callback.
 * @implements {goog.events.ListenableKey}
 * @constructor
 */
goog.events.Listener = function(
    listener, proxy, src, type, capture, opt_handler) {
  if (goog.events.Listener.ENABLE_MONITORING) {
    this.creationStack = new Error().stack;
  }

  /**
   * Callback function.
   * @type {Function}
   */
  this.listener = listener;

  /**
   * A wrapper over the original listener. This is used solely to
   * handle native browser events (it is used to simulate the capture
   * phase and to patch the event object).
   * @type {Function}
   */
  this.proxy = proxy;

  /**
   * Object or node that callback is listening to
   * @type {EventTarget|goog.events.Listenable}
   */
  this.src = src;

  /**
   * The event type.
   * @const {string}
   */
  this.type = type;

  /**
   * Whether the listener is being called in the capture or bubble phase
   * @const {boolean}
   */
  this.capture = !!capture;

  /**
   * Optional object whose context to execute the listener in
   * @type {Object|undefined}
   */
  this.handler = opt_handler;

  /**
   * The key of the listener.
   * @const {number}
   * @override
   */
  this.key = goog.events.ListenableKey.reserveKey();

  /**
   * Whether to remove the listener after it has been called.
   * @type {boolean}
   */
  this.callOnce = false;

  /**
   * Whether the listener has been removed.
   * @type {boolean}
   */
  this.removed = false;
};


/**
 * @define {boolean} Whether to enable the monitoring of the
 *     goog.events.Listener instances. Switching on the monitoring is only
 *     recommended for debugging because it has a significant impact on
 *     performance and memory usage. If switched off, the monitoring code
 *     compiles down to 0 bytes.
 */
goog.define('goog.events.Listener.ENABLE_MONITORING', false);


/**
 * If monitoring the goog.events.Listener instances is enabled, stores the
 * creation stack trace of the Disposable instance.
 * @type {string}
 */
goog.events.Listener.prototype.creationStack;


/**
 * Marks this listener as removed. This also remove references held by
 * this listener object (such as listener and event source).
 */
goog.events.Listener.prototype.markAsRemoved = function() {
  this.removed = true;
  this.listener = null;
  this.proxy = null;
  this.src = null;
  this.handler = null;
};

// Copyright 2013 The Closure Library Authors. All Rights Reserved.
//
// Licensed under the Apache License, Version 2.0 (the "License");
// you may not use this file except in compliance with the License.
// You may obtain a copy of the License at
//
//      http://www.apache.org/licenses/LICENSE-2.0
//
// Unless required by applicable law or agreed to in writing, software
// distributed under the License is distributed on an "AS-IS" BASIS,
// WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
// See the License for the specific language governing permissions and
// limitations under the License.

/**
 * @fileoverview A map of listeners that provides utility functions to
 * deal with listeners on an event target. Used by
 * {@code goog.events.EventTarget}.
 *
 * WARNING: Do not use this class from outside goog.events package.
 *
 * @visibility {//closure/goog/bin/sizetests:__pkg__}
 * @visibility {//closure/goog/events:__pkg__}
 * @visibility {//closure/goog/labs/events:__pkg__}
 */

goog.provide('goog.events.ListenerMap');

goog.require('goog.array');
goog.require('goog.events.Listener');
goog.require('goog.object');



/**
 * Creates a new listener map.
 * @param {EventTarget|goog.events.Listenable} src The src object.
 * @constructor
 * @final
 */
goog.events.ListenerMap = function(src) {
  /** @type {EventTarget|goog.events.Listenable} */
  this.src = src;

  /**
   * Maps of event type to an array of listeners.
   * @type {Object.<string, !Array.<!goog.events.Listener>>}
   */
  this.listeners = {};

  /**
   * The count of types in this map that have registered listeners.
   * @private {number}
   */
  this.typeCount_ = 0;
};


/**
 * @return {number} The count of event types in this map that actually
 *     have registered listeners.
 */
goog.events.ListenerMap.prototype.getTypeCount = function() {
  return this.typeCount_;
};


/**
 * @return {number} Total number of registered listeners.
 */
goog.events.ListenerMap.prototype.getListenerCount = function() {
  var count = 0;
  for (var type in this.listeners) {
    count += this.listeners[type].length;
  }
  return count;
};


/**
 * Adds an event listener. A listener can only be added once to an
 * object and if it is added again the key for the listener is
 * returned.
 *
 * Note that a one-off listener will not change an existing listener,
 * if any. On the other hand a normal listener will change existing
 * one-off listener to become a normal listener.
 *
 * @param {string|!goog.events.EventId} type The listener event type.
 * @param {!Function} listener This listener callback method.
 * @param {boolean} callOnce Whether the listener is a one-off
 *     listener.
 * @param {boolean=} opt_useCapture The capture mode of the listener.
 * @param {Object=} opt_listenerScope Object in whose scope to call the
 *     listener.
 * @return {goog.events.ListenableKey} Unique key for the listener.
 */
goog.events.ListenerMap.prototype.add = function(
    type, listener, callOnce, opt_useCapture, opt_listenerScope) {
  var typeStr = type.toString();
  var listenerArray = this.listeners[typeStr];
  if (!listenerArray) {
    listenerArray = this.listeners[typeStr] = [];
    this.typeCount_++;
  }

  var listenerObj;
  var index = goog.events.ListenerMap.findListenerIndex_(
      listenerArray, listener, opt_useCapture, opt_listenerScope);
  if (index > -1) {
    listenerObj = listenerArray[index];
    if (!callOnce) {
      // Ensure that, if there is an existing callOnce listener, it is no
      // longer a callOnce listener.
      listenerObj.callOnce = false;
    }
  } else {
    listenerObj = new goog.events.Listener(
        listener, null, this.src, typeStr, !!opt_useCapture, opt_listenerScope);
    listenerObj.callOnce = callOnce;
    listenerArray.push(listenerObj);
  }
  return listenerObj;
};


/**
 * Removes a matching listener.
 * @param {string|!goog.events.EventId} type The listener event type.
 * @param {!Function} listener This listener callback method.
 * @param {boolean=} opt_useCapture The capture mode of the listener.
 * @param {Object=} opt_listenerScope Object in whose scope to call the
 *     listener.
 * @return {boolean} Whether any listener was removed.
 */
goog.events.ListenerMap.prototype.remove = function(
    type, listener, opt_useCapture, opt_listenerScope) {
  var typeStr = type.toString();
  if (!(typeStr in this.listeners)) {
    return false;
  }

  var listenerArray = this.listeners[typeStr];
  var index = goog.events.ListenerMap.findListenerIndex_(
      listenerArray, listener, opt_useCapture, opt_listenerScope);
  if (index > -1) {
    var listenerObj = listenerArray[index];
    listenerObj.markAsRemoved();
    goog.array.removeAt(listenerArray, index);
    if (listenerArray.length == 0) {
      delete this.listeners[typeStr];
      this.typeCount_--;
    }
    return true;
  }
  return false;
};


/**
 * Removes the given listener object.
 * @param {goog.events.ListenableKey} listener The listener to remove.
 * @return {boolean} Whether the listener is removed.
 */
goog.events.ListenerMap.prototype.removeByKey = function(listener) {
  var type = listener.type;
  if (!(type in this.listeners)) {
    return false;
  }

  var removed = goog.array.remove(this.listeners[type], listener);
  if (removed) {
    listener.markAsRemoved();
    if (this.listeners[type].length == 0) {
      delete this.listeners[type];
      this.typeCount_--;
    }
  }
  return removed;
};


/**
 * Removes all listeners from this map. If opt_type is provided, only
 * listeners that match the given type are removed.
 * @param {string|!goog.events.EventId=} opt_type Type of event to remove.
 * @return {number} Number of listeners removed.
 */
goog.events.ListenerMap.prototype.removeAll = function(opt_type) {
  var typeStr = opt_type && opt_type.toString();
  var count = 0;
  for (var type in this.listeners) {
    if (!typeStr || type == typeStr) {
      var listenerArray = this.listeners[type];
      for (var i = 0; i < listenerArray.length; i++) {
        ++count;
        listenerArray[i].markAsRemoved();
      }
      delete this.listeners[type];
      this.typeCount_--;
    }
  }
  return count;
};


/**
 * Gets all listeners that match the given type and capture mode. The
 * returned array is a copy (but the listener objects are not).
 * @param {string|!goog.events.EventId} type The type of the listeners
 *     to retrieve.
 * @param {boolean} capture The capture mode of the listeners to retrieve.
 * @return {!Array.<goog.events.ListenableKey>} An array of matching
 *     listeners.
 */
goog.events.ListenerMap.prototype.getListeners = function(type, capture) {
  var listenerArray = this.listeners[type.toString()];
  var rv = [];
  if (listenerArray) {
    for (var i = 0; i < listenerArray.length; ++i) {
      var listenerObj = listenerArray[i];
      if (listenerObj.capture == capture) {
        rv.push(listenerObj);
      }
    }
  }
  return rv;
};


/**
 * Gets the goog.events.ListenableKey for the event or null if no such
 * listener is in use.
 *
 * @param {string|!goog.events.EventId} type The type of the listener
 *     to retrieve.
 * @param {!Function} listener The listener function to get.
 * @param {boolean} capture Whether the listener is a capturing listener.
 * @param {Object=} opt_listenerScope Object in whose scope to call the
 *     listener.
 * @return {goog.events.ListenableKey} the found listener or null if not found.
 */
goog.events.ListenerMap.prototype.getListener = function(
    type, listener, capture, opt_listenerScope) {
  var listenerArray = this.listeners[type.toString()];
  var i = -1;
  if (listenerArray) {
    i = goog.events.ListenerMap.findListenerIndex_(
        listenerArray, listener, capture, opt_listenerScope);
  }
  return i > -1 ? listenerArray[i] : null;
};


/**
 * Whether there is a matching listener. If either the type or capture
 * parameters are unspecified, the function will match on the
 * remaining criteria.
 *
 * @param {string|!goog.events.EventId=} opt_type The type of the listener.
 * @param {boolean=} opt_capture The capture mode of the listener.
 * @return {boolean} Whether there is an active listener matching
 *     the requested type and/or capture phase.
 */
goog.events.ListenerMap.prototype.hasListener = function(
    opt_type, opt_capture) {
  var hasType = goog.isDef(opt_type);
  var typeStr = hasType ? opt_type.toString() : '';
  var hasCapture = goog.isDef(opt_capture);

  return goog.object.some(
      this.listeners, function(listenerArray, type) {
        for (var i = 0; i < listenerArray.length; ++i) {
          if ((!hasType || listenerArray[i].type == typeStr) &&
              (!hasCapture || listenerArray[i].capture == opt_capture)) {
            return true;
          }
        }

        return false;
      });
};


/**
 * Finds the index of a matching goog.events.Listener in the given
 * listenerArray.
 * @param {!Array.<!goog.events.Listener>} listenerArray Array of listener.
 * @param {!Function} listener The listener function.
 * @param {boolean=} opt_useCapture The capture flag for the listener.
 * @param {Object=} opt_listenerScope The listener scope.
 * @return {number} The index of the matching listener within the
 *     listenerArray.
 * @private
 */
goog.events.ListenerMap.findListenerIndex_ = function(
    listenerArray, listener, opt_useCapture, opt_listenerScope) {
  for (var i = 0; i < listenerArray.length; ++i) {
    var listenerObj = listenerArray[i];
    if (!listenerObj.removed &&
        listenerObj.listener == listener &&
        listenerObj.capture == !!opt_useCapture &&
        listenerObj.handler == opt_listenerScope) {
      return i;
    }
  }
  return -1;
};

// Copyright 2005 The Closure Library Authors. All Rights Reserved.
//
// Licensed under the Apache License, Version 2.0 (the "License");
// you may not use this file except in compliance with the License.
// You may obtain a copy of the License at
//
//      http://www.apache.org/licenses/LICENSE-2.0
//
// Unless required by applicable law or agreed to in writing, software
// distributed under the License is distributed on an "AS-IS" BASIS,
// WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
// See the License for the specific language governing permissions and
// limitations under the License.

/**
 * @fileoverview An event manager for both native browser event
 * targets and custom JavaScript event targets
 * ({@code goog.events.Listenable}). This provides an abstraction
 * over browsers' event systems.
 *
 * It also provides a simulation of W3C event model's capture phase in
 * Internet Explorer (IE 8 and below). Caveat: the simulation does not
 * interact well with listeners registered directly on the elements
 * (bypassing goog.events) or even with listeners registered via
 * goog.events in a separate JS binary. In these cases, we provide
 * no ordering guarantees.
 *
 * The listeners will receive a "patched" event object. Such event object
 * contains normalized values for certain event properties that differs in
 * different browsers.
 *
 * Example usage:
 * <pre>
 * goog.events.listen(myNode, 'click', function(e) { alert('woo') });
 * goog.events.listen(myNode, 'mouseover', mouseHandler, true);
 * goog.events.unlisten(myNode, 'mouseover', mouseHandler, true);
 * goog.events.removeAll(myNode);
 * </pre>
 *
 *                                            in IE and event object patching]
 * @author arv@google.com (Erik Arvidsson)
 *
 * @see ../demos/events.html
 * @see ../demos/event-propagation.html
 * @see ../demos/stopevent.html
 */

// IMPLEMENTATION NOTES:
// goog.events stores an auxiliary data structure on each EventTarget
// source being listened on. This allows us to take advantage of GC,
// having the data structure GC'd when the EventTarget is GC'd. This
// GC behavior is equivalent to using W3C DOM Events directly.

goog.provide('goog.events');
goog.provide('goog.events.CaptureSimulationMode');
goog.provide('goog.events.Key');
goog.provide('goog.events.ListenableType');

goog.require('goog.asserts');
goog.require('goog.debug.entryPointRegistry');
goog.require('goog.events.BrowserEvent');
goog.require('goog.events.BrowserFeature');
goog.require('goog.events.Listenable');
goog.require('goog.events.ListenerMap');

goog.forwardDeclare('goog.debug.ErrorHandler');
goog.forwardDeclare('goog.events.EventWrapper');


/**
 * @typedef {number|goog.events.ListenableKey}
 */
goog.events.Key;


/**
 * @typedef {EventTarget|goog.events.Listenable}
 */
goog.events.ListenableType;


/**
 * Property name on a native event target for the listener map
 * associated with the event target.
 * @private @const {string}
 */
goog.events.LISTENER_MAP_PROP_ = 'closure_lm_' + ((Math.random() * 1e6) | 0);


/**
 * String used to prepend to IE event types.
 * @const
 * @private
 */
goog.events.onString_ = 'on';


/**
 * Map of computed "on<eventname>" strings for IE event types. Caching
 * this removes an extra object allocation in goog.events.listen which
 * improves IE6 performance.
 * @const
 * @dict
 * @private
 */
goog.events.onStringMap_ = {};


/**
 * @enum {number} Different capture simulation mode for IE8-.
 */
goog.events.CaptureSimulationMode = {
  /**
   * Does not perform capture simulation. Will asserts in IE8- when you
   * add capture listeners.
   */
  OFF_AND_FAIL: 0,

  /**
   * Does not perform capture simulation, silently ignore capture
   * listeners.
   */
  OFF_AND_SILENT: 1,

  /**
   * Performs capture simulation.
   */
  ON: 2
};


/**
 * @define {number} The capture simulation mode for IE8-. By default,
 *     this is ON.
 */
goog.define('goog.events.CAPTURE_SIMULATION_MODE', 2);


/**
 * Estimated count of total native listeners.
 * @private {number}
 */
goog.events.listenerCountEstimate_ = 0;


/**
 * Adds an event listener for a specific event on a native event
 * target (such as a DOM element) or an object that has implemented
 * {@link goog.events.Listenable}. A listener can only be added once
 * to an object and if it is added again the key for the listener is
 * returned. Note that if the existing listener is a one-off listener
 * (registered via listenOnce), it will no longer be a one-off
 * listener after a call to listen().
 *
 * @param {EventTarget|goog.events.Listenable} src The node to listen
 *     to events on.
 * @param {string|Array.<string>|
 *     !goog.events.EventId.<EVENTOBJ>|!Array.<!goog.events.EventId.<EVENTOBJ>>}
 *     type Event type or array of event types.
 * @param {function(this:T, EVENTOBJ):?|{handleEvent:function(?):?}|null}
 *     listener Callback method, or an object with a handleEvent function.
 *     WARNING: passing an Object is now softly deprecated.
 * @param {boolean=} opt_capt Whether to fire in capture phase (defaults to
 *     false).
 * @param {T=} opt_handler Element in whose scope to call the listener.
 * @return {goog.events.Key} Unique key for the listener.
 * @template T,EVENTOBJ
 */
goog.events.listen = function(src, type, listener, opt_capt, opt_handler) {
  if (goog.isArray(type)) {
    for (var i = 0; i < type.length; i++) {
      goog.events.listen(src, type[i], listener, opt_capt, opt_handler);
    }
    return null;
  }

  listener = goog.events.wrapListener(listener);
  if (goog.events.Listenable.isImplementedBy(src)) {
    return src.listen(
        /** @type {string|!goog.events.EventId} */ (type),
        listener, opt_capt, opt_handler);
  } else {
    return goog.events.listen_(
        /** @type {EventTarget} */ (src),
        /** @type {string|!goog.events.EventId} */ (type),
        listener, /* callOnce */ false, opt_capt, opt_handler);
  }
};


/**
 * Adds an event listener for a specific event on a native event
 * target. A listener can only be added once to an object and if it
 * is added again the key for the listener is returned.
 *
 * Note that a one-off listener will not change an existing listener,
 * if any. On the other hand a normal listener will change existing
 * one-off listener to become a normal listener.
 *
 * @param {EventTarget} src The node to listen to events on.
 * @param {string|!goog.events.EventId} type Event type.
 * @param {!Function} listener Callback function.
 * @param {boolean} callOnce Whether the listener is a one-off
 *     listener or otherwise.
 * @param {boolean=} opt_capt Whether to fire in capture phase (defaults to
 *     false).
 * @param {Object=} opt_handler Element in whose scope to call the listener.
 * @return {goog.events.ListenableKey} Unique key for the listener.
 * @private
 */
goog.events.listen_ = function(
    src, type, listener, callOnce, opt_capt, opt_handler) {
  if (!type) {
    throw Error('Invalid event type');
  }

  var capture = !!opt_capt;
  if (capture && !goog.events.BrowserFeature.HAS_W3C_EVENT_SUPPORT) {
    if (goog.events.CAPTURE_SIMULATION_MODE ==
        goog.events.CaptureSimulationMode.OFF_AND_FAIL) {
      goog.asserts.fail('Can not register capture listener in IE8-.');
      return null;
    } else if (goog.events.CAPTURE_SIMULATION_MODE ==
        goog.events.CaptureSimulationMode.OFF_AND_SILENT) {
      return null;
    }
  }

  var listenerMap = goog.events.getListenerMap_(src);
  if (!listenerMap) {
    src[goog.events.LISTENER_MAP_PROP_] = listenerMap =
        new goog.events.ListenerMap(src);
  }

  var listenerObj = listenerMap.add(
      type, listener, callOnce, opt_capt, opt_handler);

  // If the listenerObj already has a proxy, it has been set up
  // previously. We simply return.
  if (listenerObj.proxy) {
    return listenerObj;
  }

  var proxy = goog.events.getProxy();
  listenerObj.proxy = proxy;

  proxy.src = src;
  proxy.listener = listenerObj;

  // Attach the proxy through the browser's API
  if (src.addEventListener) {
    src.addEventListener(type.toString(), proxy, capture);
  } else {
    // The else above used to be else if (src.attachEvent) and then there was
    // another else statement that threw an exception warning the developer
    // they made a mistake. This resulted in an extra object allocation in IE6
    // due to a wrapper object that had to be implemented around the element
    // and so was removed.
    src.attachEvent(goog.events.getOnString_(type.toString()), proxy);
  }

  goog.events.listenerCountEstimate_++;
  return listenerObj;
};


/**
 * Helper function for returning a proxy function.
 * @return {!Function} A new or reused function object.
 */
goog.events.getProxy = function() {
  var proxyCallbackFunction = goog.events.handleBrowserEvent_;
  // Use a local var f to prevent one allocation.
  var f = goog.events.BrowserFeature.HAS_W3C_EVENT_SUPPORT ?
      function(eventObject) {
        return proxyCallbackFunction.call(f.src, f.listener, eventObject);
      } :
      function(eventObject) {
        var v = proxyCallbackFunction.call(f.src, f.listener, eventObject);
        // NOTE(chrishenry): In IE, we hack in a capture phase. However, if
        // there is inline event handler which tries to prevent default (for
        // example <a href="..." onclick="return false">...</a>) in a
        // descendant element, the prevent default will be overridden
        // by this listener if this listener were to return true. Hence, we
        // return undefined.
        if (!v) return v;
      };
  return f;
};


/**
 * Adds an event listener for a specific event on a native event
 * target (such as a DOM element) or an object that has implemented
 * {@link goog.events.Listenable}. After the event has fired the event
 * listener is removed from the target.
 *
 * If an existing listener already exists, listenOnce will do
 * nothing. In particular, if the listener was previously registered
 * via listen(), listenOnce() will not turn the listener into a
 * one-off listener. Similarly, if there is already an existing
 * one-off listener, listenOnce does not modify the listeners (it is
 * still a once listener).
 *
 * @param {EventTarget|goog.events.Listenable} src The node to listen
 *     to events on.
 * @param {string|Array.<string>|
 *     !goog.events.EventId.<EVENTOBJ>|!Array.<!goog.events.EventId.<EVENTOBJ>>}
 *     type Event type or array of event types.
 * @param {function(this:T, EVENTOBJ):?|{handleEvent:function(?):?}|null}
 *     listener Callback method.
 * @param {boolean=} opt_capt Fire in capture phase?.
 * @param {T=} opt_handler Element in whose scope to call the listener.
 * @return {goog.events.Key} Unique key for the listener.
 * @template T,EVENTOBJ
 */
goog.events.listenOnce = function(src, type, listener, opt_capt, opt_handler) {
  if (goog.isArray(type)) {
    for (var i = 0; i < type.length; i++) {
      goog.events.listenOnce(src, type[i], listener, opt_capt, opt_handler);
    }
    return null;
  }

  listener = goog.events.wrapListener(listener);
  if (goog.events.Listenable.isImplementedBy(src)) {
    return src.listenOnce(
        /** @type {string|!goog.events.EventId} */ (type),
        listener, opt_capt, opt_handler);
  } else {
    return goog.events.listen_(
        /** @type {EventTarget} */ (src),
        /** @type {string|!goog.events.EventId} */ (type),
        listener, /* callOnce */ true, opt_capt, opt_handler);
  }
};


/**
 * Adds an event listener with a specific event wrapper on a DOM Node or an
 * object that has implemented {@link goog.events.Listenable}. A listener can
 * only be added once to an object.
 *
 * @param {EventTarget|goog.events.Listenable} src The target to
 *     listen to events on.
 * @param {goog.events.EventWrapper} wrapper Event wrapper to use.
 * @param {function(this:T, ?):?|{handleEvent:function(?):?}|null} listener
 *     Callback method, or an object with a handleEvent function.
 * @param {boolean=} opt_capt Whether to fire in capture phase (defaults to
 *     false).
 * @param {T=} opt_handler Element in whose scope to call the listener.
 * @template T
 */
goog.events.listenWithWrapper = function(src, wrapper, listener, opt_capt,
    opt_handler) {
  wrapper.listen(src, listener, opt_capt, opt_handler);
};


/**
 * Removes an event listener which was added with listen().
 *
 * @param {EventTarget|goog.events.Listenable} src The target to stop
 *     listening to events on.
 * @param {string|Array.<string>|
 *     !goog.events.EventId.<EVENTOBJ>|!Array.<!goog.events.EventId.<EVENTOBJ>>}
 *     type Event type or array of event types to unlisten to.
 * @param {function(?):?|{handleEvent:function(?):?}|null} listener The
 *     listener function to remove.
 * @param {boolean=} opt_capt In DOM-compliant browsers, this determines
 *     whether the listener is fired during the capture or bubble phase of the
 *     event.
 * @param {Object=} opt_handler Element in whose scope to call the listener.
 * @return {?boolean} indicating whether the listener was there to remove.
 * @template EVENTOBJ
 */
goog.events.unlisten = function(src, type, listener, opt_capt, opt_handler) {
  if (goog.isArray(type)) {
    for (var i = 0; i < type.length; i++) {
      goog.events.unlisten(src, type[i], listener, opt_capt, opt_handler);
    }
    return null;
  }

  listener = goog.events.wrapListener(listener);
  if (goog.events.Listenable.isImplementedBy(src)) {
    return src.unlisten(
        /** @type {string|!goog.events.EventId} */ (type),
        listener, opt_capt, opt_handler);
  }

  if (!src) {
    // TODO(chrishenry): We should tighten the API to only accept
    // non-null objects, or add an assertion here.
    return false;
  }

  var capture = !!opt_capt;
  var listenerMap = goog.events.getListenerMap_(
      /** @type {EventTarget} */ (src));
  if (listenerMap) {
    var listenerObj = listenerMap.getListener(
        /** @type {string|!goog.events.EventId} */ (type),
        listener, capture, opt_handler);
    if (listenerObj) {
      return goog.events.unlistenByKey(listenerObj);
    }
  }

  return false;
};


/**
 * Removes an event listener which was added with listen() by the key
 * returned by listen().
 *
 * @param {goog.events.Key} key The key returned by listen() for this
 *     event listener.
 * @return {boolean} indicating whether the listener was there to remove.
 */
goog.events.unlistenByKey = function(key) {
  // TODO(chrishenry): Remove this check when tests that rely on this
  // are fixed.
  if (goog.isNumber(key)) {
    return false;
  }

  var listener = /** @type {goog.events.ListenableKey} */ (key);
  if (!listener || listener.removed) {
    return false;
  }

  var src = listener.src;
  if (goog.events.Listenable.isImplementedBy(src)) {
    return src.unlistenByKey(listener);
  }

  var type = listener.type;
  var proxy = listener.proxy;
  if (src.removeEventListener) {
    src.removeEventListener(type, proxy, listener.capture);
  } else if (src.detachEvent) {
    src.detachEvent(goog.events.getOnString_(type), proxy);
  }
  goog.events.listenerCountEstimate_--;

  var listenerMap = goog.events.getListenerMap_(
      /** @type {EventTarget} */ (src));
  // TODO(chrishenry): Try to remove this conditional and execute the
  // first branch always. This should be safe.
  if (listenerMap) {
    listenerMap.removeByKey(listener);
    if (listenerMap.getTypeCount() == 0) {
      // Null the src, just because this is simple to do (and useful
      // for IE <= 7).
      listenerMap.src = null;
      // We don't use delete here because IE does not allow delete
      // on a window object.
      src[goog.events.LISTENER_MAP_PROP_] = null;
    }
  } else {
    listener.markAsRemoved();
  }

  return true;
};


/**
 * Removes an event listener which was added with listenWithWrapper().
 *
 * @param {EventTarget|goog.events.Listenable} src The target to stop
 *     listening to events on.
 * @param {goog.events.EventWrapper} wrapper Event wrapper to use.
 * @param {function(?):?|{handleEvent:function(?):?}|null} listener The
 *     listener function to remove.
 * @param {boolean=} opt_capt In DOM-compliant browsers, this determines
 *     whether the listener is fired during the capture or bubble phase of the
 *     event.
 * @param {Object=} opt_handler Element in whose scope to call the listener.
 */
goog.events.unlistenWithWrapper = function(src, wrapper, listener, opt_capt,
    opt_handler) {
  wrapper.unlisten(src, listener, opt_capt, opt_handler);
};


/**
 * Removes all listeners from an object. You can also optionally
 * remove listeners of a particular type.
 *
 * @param {Object|undefined} obj Object to remove listeners from. Must be an
 *     EventTarget or a goog.events.Listenable.
 * @param {string|!goog.events.EventId=} opt_type Type of event to remove.
 *     Default is all types.
 * @return {number} Number of listeners removed.
 */
goog.events.removeAll = function(obj, opt_type) {
  // TODO(chrishenry): Change the type of obj to
  // (!EventTarget|!goog.events.Listenable).

  if (!obj) {
    return 0;
  }

  if (goog.events.Listenable.isImplementedBy(obj)) {
    return obj.removeAllListeners(opt_type);
  }

  var listenerMap = goog.events.getListenerMap_(
      /** @type {EventTarget} */ (obj));
  if (!listenerMap) {
    return 0;
  }

  var count = 0;
  var typeStr = opt_type && opt_type.toString();
  for (var type in listenerMap.listeners) {
    if (!typeStr || type == typeStr) {
      // Clone so that we don't need to worry about unlistenByKey
      // changing the content of the ListenerMap.
      var listeners = listenerMap.listeners[type].concat();
      for (var i = 0; i < listeners.length; ++i) {
        if (goog.events.unlistenByKey(listeners[i])) {
          ++count;
        }
      }
    }
  }
  return count;
};


/**
 * Removes all native listeners registered via goog.events. Native
 * listeners are listeners on native browser objects (such as DOM
 * elements). In particular, goog.events.Listenable and
 * goog.events.EventTarget listeners will NOT be removed.
 * @return {number} Number of listeners removed.
 * @deprecated This doesn't do anything, now that Closure no longer
 * stores a central listener registry.
 */
goog.events.removeAllNativeListeners = function() {
  goog.events.listenerCountEstimate_ = 0;
  return 0;
};


/**
 * Gets the listeners for a given object, type and capture phase.
 *
 * @param {Object} obj Object to get listeners for.
 * @param {string|!goog.events.EventId} type Event type.
 * @param {boolean} capture Capture phase?.
 * @return {Array.<goog.events.Listener>} Array of listener objects.
 */
goog.events.getListeners = function(obj, type, capture) {
  if (goog.events.Listenable.isImplementedBy(obj)) {
    return obj.getListeners(type, capture);
  } else {
    if (!obj) {
      // TODO(chrishenry): We should tighten the API to accept
      // !EventTarget|goog.events.Listenable, and add an assertion here.
      return [];
    }

    var listenerMap = goog.events.getListenerMap_(
        /** @type {EventTarget} */ (obj));
    return listenerMap ? listenerMap.getListeners(type, capture) : [];
  }
};


/**
 * Gets the goog.events.Listener for the event or null if no such listener is
 * in use.
 *
 * @param {EventTarget|goog.events.Listenable} src The target from
 *     which to get listeners.
 * @param {?string|!goog.events.EventId.<EVENTOBJ>} type The type of the event.
 * @param {function(EVENTOBJ):?|{handleEvent:function(?):?}|null} listener The
 *     listener function to get.
 * @param {boolean=} opt_capt In DOM-compliant browsers, this determines
 *                            whether the listener is fired during the
 *                            capture or bubble phase of the event.
 * @param {Object=} opt_handler Element in whose scope to call the listener.
 * @return {goog.events.ListenableKey} the found listener or null if not found.
 * @template EVENTOBJ
 */
goog.events.getListener = function(src, type, listener, opt_capt, opt_handler) {
  // TODO(chrishenry): Change type from ?string to string, or add assertion.
  type = /** @type {string} */ (type);
  listener = goog.events.wrapListener(listener);
  var capture = !!opt_capt;
  if (goog.events.Listenable.isImplementedBy(src)) {
    return src.getListener(type, listener, capture, opt_handler);
  }

  if (!src) {
    // TODO(chrishenry): We should tighten the API to only accept
    // non-null objects, or add an assertion here.
    return null;
  }

  var listenerMap = goog.events.getListenerMap_(
      /** @type {EventTarget} */ (src));
  if (listenerMap) {
    return listenerMap.getListener(type, listener, capture, opt_handler);
  }
  return null;
};


/**
 * Returns whether an event target has any active listeners matching the
 * specified signature. If either the type or capture parameters are
 * unspecified, the function will match on the remaining criteria.
 *
 * @param {EventTarget|goog.events.Listenable} obj Target to get
 *     listeners for.
 * @param {string|!goog.events.EventId=} opt_type Event type.
 * @param {boolean=} opt_capture Whether to check for capture or bubble-phase
 *     listeners.
 * @return {boolean} Whether an event target has one or more listeners matching
 *     the requested type and/or capture phase.
 */
goog.events.hasListener = function(obj, opt_type, opt_capture) {
  if (goog.events.Listenable.isImplementedBy(obj)) {
    return obj.hasListener(opt_type, opt_capture);
  }

  var listenerMap = goog.events.getListenerMap_(
      /** @type {EventTarget} */ (obj));
  return !!listenerMap && listenerMap.hasListener(opt_type, opt_capture);
};


/**
 * Provides a nice string showing the normalized event objects public members
 * @param {Object} e Event Object.
 * @return {string} String of the public members of the normalized event object.
 */
goog.events.expose = function(e) {
  var str = [];
  for (var key in e) {
    if (e[key] && e[key].id) {
      str.push(key + ' = ' + e[key] + ' (' + e[key].id + ')');
    } else {
      str.push(key + ' = ' + e[key]);
    }
  }
  return str.join('\n');
};


/**
 * Returns a string with on prepended to the specified type. This is used for IE
 * which expects "on" to be prepended. This function caches the string in order
 * to avoid extra allocations in steady state.
 * @param {string} type Event type.
 * @return {string} The type string with 'on' prepended.
 * @private
 */
goog.events.getOnString_ = function(type) {
  if (type in goog.events.onStringMap_) {
    return goog.events.onStringMap_[type];
  }
  return goog.events.onStringMap_[type] = goog.events.onString_ + type;
};


/**
 * Fires an object's listeners of a particular type and phase
 *
 * @param {Object} obj Object whose listeners to call.
 * @param {string|!goog.events.EventId} type Event type.
 * @param {boolean} capture Which event phase.
 * @param {Object} eventObject Event object to be passed to listener.
 * @return {boolean} True if all listeners returned true else false.
 */
goog.events.fireListeners = function(obj, type, capture, eventObject) {
  if (goog.events.Listenable.isImplementedBy(obj)) {
    return obj.fireListeners(type, capture, eventObject);
  }

  return goog.events.fireListeners_(obj, type, capture, eventObject);
};


/**
 * Fires an object's listeners of a particular type and phase.
 * @param {Object} obj Object whose listeners to call.
 * @param {string|!goog.events.EventId} type Event type.
 * @param {boolean} capture Which event phase.
 * @param {Object} eventObject Event object to be passed to listener.
 * @return {boolean} True if all listeners returned true else false.
 * @private
 */
goog.events.fireListeners_ = function(obj, type, capture, eventObject) {
  var retval = 1;

  var listenerMap = goog.events.getListenerMap_(
      /** @type {EventTarget} */ (obj));
  if (listenerMap) {
    // TODO(chrishenry): Original code avoids array creation when there
    // is no listener, so we do the same. If this optimization turns
    // out to be not required, we can replace this with
    // listenerMap.getListeners(type, capture) instead, which is simpler.
    var listenerArray = listenerMap.listeners[type.toString()];
    if (listenerArray) {
      listenerArray = listenerArray.concat();
      for (var i = 0; i < listenerArray.length; i++) {
        var listener = listenerArray[i];
        // We might not have a listener if the listener was removed.
        if (listener && listener.capture == capture && !listener.removed) {
          retval &=
              goog.events.fireListener(listener, eventObject) !== false;
        }
      }
    }
  }
  return Boolean(retval);
};


/**
 * Fires a listener with a set of arguments
 *
 * @param {goog.events.Listener} listener The listener object to call.
 * @param {Object} eventObject The event object to pass to the listener.
 * @return {boolean} Result of listener.
 */
goog.events.fireListener = function(listener, eventObject) {
  var listenerFn = listener.listener;
  var listenerHandler = listener.handler || listener.src;

  if (listener.callOnce) {
    goog.events.unlistenByKey(listener);
  }
  return listenerFn.call(listenerHandler, eventObject);
};


/**
 * Gets the total number of listeners currently in the system.
 * @return {number} Number of listeners.
 * @deprecated This returns estimated count, now that Closure no longer
 * stores a central listener registry. We still return an estimation
 * to keep existing listener-related tests passing. In the near future,
 * this function will be removed.
 */
goog.events.getTotalListenerCount = function() {
  return goog.events.listenerCountEstimate_;
};


/**
 * Dispatches an event (or event like object) and calls all listeners
 * listening for events of this type. The type of the event is decided by the
 * type property on the event object.
 *
 * If any of the listeners returns false OR calls preventDefault then this
 * function will return false.  If one of the capture listeners calls
 * stopPropagation, then the bubble listeners won't fire.
 *
 * @param {goog.events.Listenable} src The event target.
 * @param {goog.events.EventLike} e Event object.
 * @return {boolean} If anyone called preventDefault on the event object (or
 *     if any of the handlers returns false) this will also return false.
 *     If there are no handlers, or if all handlers return true, this returns
 *     true.
 */
goog.events.dispatchEvent = function(src, e) {
  goog.asserts.assert(
      goog.events.Listenable.isImplementedBy(src),
      'Can not use goog.events.dispatchEvent with ' +
      'non-goog.events.Listenable instance.');
  return src.dispatchEvent(e);
};


/**
 * Installs exception protection for the browser event entry point using the
 * given error handler.
 *
 * @param {goog.debug.ErrorHandler} errorHandler Error handler with which to
 *     protect the entry point.
 */
goog.events.protectBrowserEventEntryPoint = function(errorHandler) {
  goog.events.handleBrowserEvent_ = errorHandler.protectEntryPoint(
      goog.events.handleBrowserEvent_);
};


/**
 * Handles an event and dispatches it to the correct listeners. This
 * function is a proxy for the real listener the user specified.
 *
 * @param {goog.events.Listener} listener The listener object.
 * @param {Event=} opt_evt Optional event object that gets passed in via the
 *     native event handlers.
 * @return {boolean} Result of the event handler.
 * @this {EventTarget} The object or Element that fired the event.
 * @private
 */
goog.events.handleBrowserEvent_ = function(listener, opt_evt) {
  if (listener.removed) {
    return true;
  }

  // Synthesize event propagation if the browser does not support W3C
  // event model.
  if (!goog.events.BrowserFeature.HAS_W3C_EVENT_SUPPORT) {
    var ieEvent = opt_evt ||
        /** @type {Event} */ (goog.getObjectByName('window.event'));
    var evt = new goog.events.BrowserEvent(ieEvent, this);
    var retval = true;

    if (goog.events.CAPTURE_SIMULATION_MODE ==
            goog.events.CaptureSimulationMode.ON) {
      // If we have not marked this event yet, we should perform capture
      // simulation.
      if (!goog.events.isMarkedIeEvent_(ieEvent)) {
        goog.events.markIeEvent_(ieEvent);

        var ancestors = [];
        for (var parent = evt.currentTarget; parent;
             parent = parent.parentNode) {
          ancestors.push(parent);
        }

        // Fire capture listeners.
        var type = listener.type;
        for (var i = ancestors.length - 1; !evt.propagationStopped_ && i >= 0;
             i--) {
          evt.currentTarget = ancestors[i];
          retval &= goog.events.fireListeners_(ancestors[i], type, true, evt);
        }

        // Fire bubble listeners.
        //
        // We can technically rely on IE to perform bubble event
        // propagation. However, it turns out that IE fires events in
        // opposite order of attachEvent registration, which broke
        // some code and tests that rely on the order. (While W3C DOM
        // Level 2 Events TR leaves the event ordering unspecified,
        // modern browsers and W3C DOM Level 3 Events Working Draft
        // actually specify the order as the registration order.)
        for (var i = 0; !evt.propagationStopped_ && i < ancestors.length; i++) {
          evt.currentTarget = ancestors[i];
          retval &= goog.events.fireListeners_(ancestors[i], type, false, evt);
        }
      }
    } else {
      retval = goog.events.fireListener(listener, evt);
    }
    return retval;
  }

  // Otherwise, simply fire the listener.
  return goog.events.fireListener(
      listener, new goog.events.BrowserEvent(opt_evt, this));
};


/**
 * This is used to mark the IE event object so we do not do the Closure pass
 * twice for a bubbling event.
 * @param {Event} e The IE browser event.
 * @private
 */
goog.events.markIeEvent_ = function(e) {
  // Only the keyCode and the returnValue can be changed. We use keyCode for
  // non keyboard events.
  // event.returnValue is a bit more tricky. It is undefined by default. A
  // boolean false prevents the default action. In a window.onbeforeunload and
  // the returnValue is non undefined it will be alerted. However, we will only
  // modify the returnValue for keyboard events. We can get a problem if non
  // closure events sets the keyCode or the returnValue

  var useReturnValue = false;

  if (e.keyCode == 0) {
    // We cannot change the keyCode in case that srcElement is input[type=file].
    // We could test that that is the case but that would allocate 3 objects.
    // If we use try/catch we will only allocate extra objects in the case of a
    // failure.
    /** @preserveTry */
    try {
      e.keyCode = -1;
      return;
    } catch (ex) {
      useReturnValue = true;
    }
  }

  if (useReturnValue ||
      /** @type {boolean|undefined} */ (e.returnValue) == undefined) {
    e.returnValue = true;
  }
};


/**
 * This is used to check if an IE event has already been handled by the Closure
 * system so we do not do the Closure pass twice for a bubbling event.
 * @param {Event} e  The IE browser event.
 * @return {boolean} True if the event object has been marked.
 * @private
 */
goog.events.isMarkedIeEvent_ = function(e) {
  return e.keyCode < 0 || e.returnValue != undefined;
};


/**
 * Counter to create unique event ids.
 * @private {number}
 */
goog.events.uniqueIdCounter_ = 0;


/**
 * Creates a unique event id.
 *
 * @param {string} identifier The identifier.
 * @return {string} A unique identifier.
 * @idGenerator
 */
goog.events.getUniqueId = function(identifier) {
  return identifier + '_' + goog.events.uniqueIdCounter_++;
};


/**
 * @param {EventTarget} src The source object.
 * @return {goog.events.ListenerMap} A listener map for the given
 *     source object, or null if none exists.
 * @private
 */
goog.events.getListenerMap_ = function(src) {
  var listenerMap = src[goog.events.LISTENER_MAP_PROP_];
  // IE serializes the property as well (e.g. when serializing outer
  // HTML). So we must check that the value is of the correct type.
  return listenerMap instanceof goog.events.ListenerMap ? listenerMap : null;
};


/**
 * Expando property for listener function wrapper for Object with
 * handleEvent.
 * @private @const {string}
 */
goog.events.LISTENER_WRAPPER_PROP_ = '__closure_events_fn_' +
    ((Math.random() * 1e9) >>> 0);


/**
 * @param {Object|Function} listener The listener function or an
 *     object that contains handleEvent method.
 * @return {!Function} Either the original function or a function that
 *     calls obj.handleEvent. If the same listener is passed to this
 *     function more than once, the same function is guaranteed to be
 *     returned.
 */
goog.events.wrapListener = function(listener) {
  goog.asserts.assert(listener, 'Listener can not be null.');

  if (goog.isFunction(listener)) {
    return listener;
  }

  goog.asserts.assert(
      listener.handleEvent, 'An object listener must have handleEvent method.');
  if (!listener[goog.events.LISTENER_WRAPPER_PROP_]) {
    listener[goog.events.LISTENER_WRAPPER_PROP_] =
        function(e) { return listener.handleEvent(e); };
  }
  return listener[goog.events.LISTENER_WRAPPER_PROP_];
};


// Register the browser event handler as an entry point, so that
// it can be monitored for exception handling, etc.
goog.debug.entryPointRegistry.register(
    /**
     * @param {function(!Function): !Function} transformer The transforming
     *     function.
     */
    function(transformer) {
      goog.events.handleBrowserEvent_ = transformer(
          goog.events.handleBrowserEvent_);
    });

// OpenLayers 3. See http://openlayers.org/
// License: https://raw.githubusercontent.com/openlayers/ol3/master/LICENSE.md
// Version: v3.13.0

(function (root, factory) {
  if (typeof exports === "object") {
    module.exports = factory();
  } else if (typeof define === "function" && define.amd) {
    define([], factory);
  } else {
    root.ol = factory();
  }
}(this, function () {
  var OPENLAYERS = {};
  var l,aa=aa||{},ba=this;function ca(b){return void 0!==b}function u(b,c,d){b=b.split(".");d=d||ba;b[0]in d||!d.execScript||d.execScript("var "+b[0]);for(var e;b.length&&(e=b.shift());)!b.length&&ca(c)?d[e]=c:d[e]?d=d[e]:d=d[e]={}}function da(){}function ea(b){b.Zb=function(){return b.Ug?b.Ug:b.Ug=new b}}
function ha(b){var c=typeof b;if("object"==c)if(b){if(b instanceof Array)return"array";if(b instanceof Object)return c;var d=Object.prototype.toString.call(b);if("[object Window]"==d)return"object";if("[object Array]"==d||"number"==typeof b.length&&"undefined"!=typeof b.splice&&"undefined"!=typeof b.propertyIsEnumerable&&!b.propertyIsEnumerable("splice"))return"array";if("[object Function]"==d||"undefined"!=typeof b.call&&"undefined"!=typeof b.propertyIsEnumerable&&!b.propertyIsEnumerable("call"))return"function"}else return"null";
else if("function"==c&&"undefined"==typeof b.call)return"object";return c}function ia(b){return"array"==ha(b)}function ka(b){var c=ha(b);return"array"==c||"object"==c&&"number"==typeof b.length}function la(b){return"string"==typeof b}function ma(b){return"number"==typeof b}function na(b){return"function"==ha(b)}function oa(b){var c=typeof b;return"object"==c&&null!=b||"function"==c}function w(b){return b[pa]||(b[pa]=++qa)}var pa="closure_uid_"+(1E9*Math.random()>>>0),qa=0;
function ra(b,c,d){return b.call.apply(b.bind,arguments)}function sa(b,c,d){if(!b)throw Error();if(2<arguments.length){var e=Array.prototype.slice.call(arguments,2);return function(){var d=Array.prototype.slice.call(arguments);Array.prototype.unshift.apply(d,e);return b.apply(c,d)}}return function(){return b.apply(c,arguments)}}function ta(b,c,d){ta=Function.prototype.bind&&-1!=Function.prototype.bind.toString().indexOf("native code")?ra:sa;return ta.apply(null,arguments)}
function ua(b,c){var d=Array.prototype.slice.call(arguments,1);return function(){var c=d.slice();c.push.apply(c,arguments);return b.apply(this,c)}}var va=Date.now||function(){return+new Date};function z(b,c){function d(){}d.prototype=c.prototype;b.da=c.prototype;b.prototype=new d;b.prototype.constructor=b;b.Hp=function(b,d,g){for(var h=Array(arguments.length-2),k=2;k<arguments.length;k++)h[k-2]=arguments[k];return c.prototype[d].apply(b,h)}};var wa,xa;function ya(){};function za(b){if(Error.captureStackTrace)Error.captureStackTrace(this,za);else{var c=Error().stack;c&&(this.stack=c)}b&&(this.message=String(b))}z(za,Error);za.prototype.name="CustomError";var Aa;function Ba(b,c){var d=b.length-c.length;return 0<=d&&b.indexOf(c,d)==d}function Ca(b,c){for(var d=b.split("%s"),e="",f=Array.prototype.slice.call(arguments,1);f.length&&1<d.length;)e+=d.shift()+f.shift();return e+d.join("%s")}var Da=String.prototype.trim?function(b){return b.trim()}:function(b){return b.replace(/^[\s\xa0]+|[\s\xa0]+$/g,"")};
function Ea(b){if(!Fa.test(b))return b;-1!=b.indexOf("&")&&(b=b.replace(Ga,"&amp;"));-1!=b.indexOf("<")&&(b=b.replace(Ha,"&lt;"));-1!=b.indexOf(">")&&(b=b.replace(Ia,"&gt;"));-1!=b.indexOf('"')&&(b=b.replace(Ka,"&quot;"));-1!=b.indexOf("'")&&(b=b.replace(La,"&#39;"));-1!=b.indexOf("\x00")&&(b=b.replace(Ma,"&#0;"));return b}var Ga=/&/g,Ha=/</g,Ia=/>/g,Ka=/"/g,La=/'/g,Ma=/\x00/g,Fa=/[\x00&<>"']/,Na=String.prototype.repeat?function(b,c){return b.repeat(c)}:function(b,c){return Array(c+1).join(b)};
function Oa(b){b=ca(void 0)?b.toFixed(void 0):String(b);var c=b.indexOf(".");-1==c&&(c=b.length);return Na("0",Math.max(0,2-c))+b}
function Pa(b,c){for(var d=0,e=Da(String(b)).split("."),f=Da(String(c)).split("."),g=Math.max(e.length,f.length),h=0;0==d&&h<g;h++){var k=e[h]||"",m=f[h]||"",n=RegExp("(\\d*)(\\D*)","g"),p=RegExp("(\\d*)(\\D*)","g");do{var q=n.exec(k)||["","",""],r=p.exec(m)||["","",""];if(0==q[0].length&&0==r[0].length)break;d=Qa(0==q[1].length?0:parseInt(q[1],10),0==r[1].length?0:parseInt(r[1],10))||Qa(0==q[2].length,0==r[2].length)||Qa(q[2],r[2])}while(0==d)}return d}function Qa(b,c){return b<c?-1:b>c?1:0};function Ra(b,c,d){return Math.min(Math.max(b,c),d)}var Ta=function(){var b;"cosh"in Math?b=Math.cosh:b=function(b){b=Math.exp(b);return(b+1/b)/2};return b}();function Ua(b,c,d,e,f,g){var h=f-d,k=g-e;if(0!==h||0!==k){var m=((b-d)*h+(c-e)*k)/(h*h+k*k);1<m?(d=f,e=g):0<m&&(d+=h*m,e+=k*m)}return Va(b,c,d,e)}function Va(b,c,d,e){b=d-b;c=e-c;return b*b+c*c}function Wa(b){return b*Math.PI/180};function Xa(b){return function(c){if(c)return[Ra(c[0],b[0],b[2]),Ra(c[1],b[1],b[3])]}}function Ya(b){return b};var Za=Array.prototype;function $a(b,c){return Za.indexOf.call(b,c,void 0)}function ab(b,c){Za.forEach.call(b,c,void 0)}function bb(b,c){return Za.filter.call(b,c,void 0)}function cb(b,c){return Za.map.call(b,c,void 0)}function db(b,c){return Za.some.call(b,c,void 0)}function eb(b,c){var d=fb(b,c,void 0);return 0>d?null:la(b)?b.charAt(d):b[d]}function fb(b,c,d){for(var e=b.length,f=la(b)?b.split(""):b,g=0;g<e;g++)if(g in f&&c.call(d,f[g],g,b))return g;return-1}
function gb(b,c){var d=$a(b,c),e;(e=0<=d)&&Za.splice.call(b,d,1);return e}function hb(b){return Za.concat.apply(Za,arguments)}function ib(b){var c=b.length;if(0<c){for(var d=Array(c),e=0;e<c;e++)d[e]=b[e];return d}return[]}function jb(b,c){for(var d=1;d<arguments.length;d++){var e=arguments[d];if(ka(e)){var f=b.length||0,g=e.length||0;b.length=f+g;for(var h=0;h<g;h++)b[f+h]=e[h]}else b.push(e)}}function kb(b,c,d,e){Za.splice.apply(b,lb(arguments,1))}
function lb(b,c,d){return 2>=arguments.length?Za.slice.call(b,c):Za.slice.call(b,c,d)}function mb(b,c){b.sort(c||nb)}function ob(b){for(var c=pb,d=0;d<b.length;d++)b[d]={index:d,value:b[d]};var e=c||nb;mb(b,function(b,c){return e(b.value,c.value)||b.index-c.index});for(d=0;d<b.length;d++)b[d]=b[d].value}function qb(b,c){if(!ka(b)||!ka(c)||b.length!=c.length)return!1;for(var d=b.length,e=rb,f=0;f<d;f++)if(!e(b[f],c[f]))return!1;return!0}function nb(b,c){return b>c?1:b<c?-1:0}
function rb(b,c){return b===c}function sb(b){for(var c=[],d=0;d<arguments.length;d++){var e=arguments[d];if(ia(e))for(var f=0;f<e.length;f+=8192)for(var g=lb(e,f,f+8192),g=sb.apply(null,g),h=0;h<g.length;h++)c.push(g[h]);else c.push(e)}return c};function tb(b,c){return b>c?1:b<c?-1:0}function ub(b,c){return 0<=b.indexOf(c)}function vb(b,c,d){var e=b.length;if(b[0]<=c)return 0;if(!(c<=b[e-1]))if(0<d)for(d=1;d<e;++d){if(b[d]<c)return d-1}else if(0>d)for(d=1;d<e;++d){if(b[d]<=c)return d}else for(d=1;d<e;++d){if(b[d]==c)return d;if(b[d]<c)return b[d-1]-c<c-b[d]?d-1:d}return e-1};function wb(b){return function(c,d,e){if(void 0!==c)return c=vb(b,c,e),c=Ra(c+d,0,b.length-1),b[c]}}function xb(b,c,d){return function(e,f,g){if(void 0!==e)return e=Math.max(Math.floor(Math.log(c/e)/Math.log(b)+(0<g?0:0>g?1:.5))+f,0),void 0!==d&&(e=Math.min(e,d)),c/Math.pow(b,e)}};function yb(b){if(void 0!==b)return 0}function zb(b,c){if(void 0!==b)return b+c}function Ab(b){var c=2*Math.PI/b;return function(b,e){if(void 0!==b)return b=Math.floor((b+e)/c+.5)*c}}function Bb(){var b=Wa(5);return function(c,d){if(void 0!==c)return Math.abs(c+d)<=b?0:c+d}};function Cb(b,c,d){this.center=b;this.resolution=c;this.rotation=d};var Db;a:{var Eb=ba.navigator;if(Eb){var Fb=Eb.userAgent;if(Fb){Db=Fb;break a}}Db=""}function Gb(b){return-1!=Db.indexOf(b)};function Hb(b,c,d){for(var e in b)c.call(d,b[e],e,b)}function Ib(b,c){for(var d in b)if(c.call(void 0,b[d],d,b))return!0;return!1}function Jb(b){var c=0,d;for(d in b)c++;return c}function Kb(b){var c=[],d=0,e;for(e in b)c[d++]=b[e];return c}function Lb(b,c){for(var d in b)if(b[d]==c)return!0;return!1}function Mb(b,c){for(var d in b)if(c.call(void 0,b[d],d,b))return d}function Nb(b){for(var c in b)return!1;return!0}function Ob(b){for(var c in b)delete b[c]}function Pb(b,c,d){return c in b?b[c]:d}
function Qb(b,c){var d=[];return c in b?b[c]:b[c]=d}function Rb(b){var c={},d;for(d in b)c[d]=b[d];return c}function Sb(b){var c=ha(b);if("object"==c||"array"==c){if(na(b.clone))return b.clone();var c="array"==c?[]:{},d;for(d in b)c[d]=Sb(b[d]);return c}return b}var Tb="constructor hasOwnProperty isPrototypeOf propertyIsEnumerable toLocaleString toString valueOf".split(" ");
function Ub(b,c){for(var d,e,f=1;f<arguments.length;f++){e=arguments[f];for(d in e)b[d]=e[d];for(var g=0;g<Tb.length;g++)d=Tb[g],Object.prototype.hasOwnProperty.call(e,d)&&(b[d]=e[d])}};var Vb=Gb("Opera")||Gb("OPR"),Wb=Gb("Trident")||Gb("MSIE"),Xb=Gb("Edge"),Yb=Gb("Gecko")&&!(-1!=Db.toLowerCase().indexOf("webkit")&&!Gb("Edge"))&&!(Gb("Trident")||Gb("MSIE"))&&!Gb("Edge"),Zb=-1!=Db.toLowerCase().indexOf("webkit")&&!Gb("Edge"),$b=Gb("Macintosh"),ac=Gb("Windows"),bc=Gb("Linux")||Gb("CrOS");function cc(){var b=Db;if(Yb)return/rv\:([^\);]+)(\)|;)/.exec(b);if(Xb)return/Edge\/([\d\.]+)/.exec(b);if(Wb)return/\b(?:MSIE|rv)[: ]([^\);]+)(\)|;)/.exec(b);if(Zb)return/WebKit\/(\S+)/.exec(b)}
function dc(){var b=ba.document;return b?b.documentMode:void 0}var ec=function(){if(Vb&&ba.opera){var b;var c=ba.opera.version;try{b=c()}catch(d){b=c}return b}b="";(c=cc())&&(b=c?c[1]:"");return Wb&&(c=dc(),c>parseFloat(b))?String(c):b}(),fc={};function gc(b){return fc[b]||(fc[b]=0<=Pa(ec,b))}var hc=ba.document,ic=hc&&Wb?dc()||("CSS1Compat"==hc.compatMode?parseInt(ec,10):5):void 0;var jc=!Wb||9<=ic,kc=!Wb||9<=ic,lc=Wb&&!gc("9");!Zb||gc("528");Yb&&gc("1.9b")||Wb&&gc("8")||Vb&&gc("9.5")||Zb&&gc("528");Yb&&!gc("8")||Wb&&gc("9");function mc(){0!=nc&&(oc[w(this)]=this);this.pa=this.pa;this.wa=this.wa}var nc=0,oc={};mc.prototype.pa=!1;mc.prototype.rc=function(){if(!this.pa&&(this.pa=!0,this.X(),0!=nc)){var b=w(this);delete oc[b]}};function pc(b,c){var d=ua(qc,c);b.pa?d.call(void 0):(b.wa||(b.wa=[]),b.wa.push(ca(void 0)?ta(d,void 0):d))}mc.prototype.X=function(){if(this.wa)for(;this.wa.length;)this.wa.shift()()};function qc(b){b&&"function"==typeof b.rc&&b.rc()};function rc(b,c){this.type=b;this.g=this.target=c;this.j=!1;this.Zh=!0}rc.prototype.b=function(){this.j=!0};rc.prototype.preventDefault=function(){this.Zh=!1};function tc(b){b.b()}function uc(b){b.preventDefault()};function vc(b){vc[" "](b);return b}vc[" "]=da;function wc(b,c){rc.call(this,b?b.type:"");this.relatedTarget=this.g=this.target=null;this.G=this.i=this.button=this.screenY=this.screenX=this.clientY=this.clientX=this.offsetY=this.offsetX=0;this.B=this.c=this.f=this.o=!1;this.state=null;this.l=!1;this.a=null;if(b){var d=this.type=b.type,e=b.changedTouches?b.changedTouches[0]:null;this.target=b.target||b.srcElement;this.g=c;var f=b.relatedTarget;if(f){if(Yb){var g;a:{try{vc(f.nodeName);g=!0;break a}catch(h){}g=!1}g||(f=null)}}else"mouseover"==d?
f=b.fromElement:"mouseout"==d&&(f=b.toElement);this.relatedTarget=f;null===e?(this.offsetX=Zb||void 0!==b.offsetX?b.offsetX:b.layerX,this.offsetY=Zb||void 0!==b.offsetY?b.offsetY:b.layerY,this.clientX=void 0!==b.clientX?b.clientX:b.pageX,this.clientY=void 0!==b.clientY?b.clientY:b.pageY,this.screenX=b.screenX||0,this.screenY=b.screenY||0):(this.clientX=void 0!==e.clientX?e.clientX:e.pageX,this.clientY=void 0!==e.clientY?e.clientY:e.pageY,this.screenX=e.screenX||0,this.screenY=e.screenY||0);this.button=
b.button;this.i=b.keyCode||0;this.G=b.charCode||("keypress"==d?b.keyCode:0);this.o=b.ctrlKey;this.f=b.altKey;this.c=b.shiftKey;this.B=b.metaKey;this.l=$b?b.metaKey:b.ctrlKey;this.state=b.state;this.a=b;b.defaultPrevented&&this.preventDefault()}}z(wc,rc);var xc=[1,4,2];function yc(b){return(jc?0==b.a.button:"click"==b.type?!0:!!(b.a.button&xc[0]))&&!(Zb&&$b&&b.o)}wc.prototype.b=function(){wc.da.b.call(this);this.a.stopPropagation?this.a.stopPropagation():this.a.cancelBubble=!0};
wc.prototype.preventDefault=function(){wc.da.preventDefault.call(this);var b=this.a;if(b.preventDefault)b.preventDefault();else if(b.returnValue=!1,lc)try{if(b.ctrlKey||112<=b.keyCode&&123>=b.keyCode)b.keyCode=-1}catch(c){}};var Ac="closure_listenable_"+(1E6*Math.random()|0);function Bc(b){return!(!b||!b[Ac])}var Cc=0;function Dc(b,c,d,e,f){this.listener=b;this.a=null;this.src=c;this.type=d;this.dd=!!e;this.me=f;this.key=++Cc;this.Vc=this.Wd=!1}function Ec(b){b.Vc=!0;b.listener=null;b.a=null;b.src=null;b.me=null};function Fc(b){this.src=b;this.a={};this.f=0}function Gc(b,c,d,e,f,g){var h=c.toString();c=b.a[h];c||(c=b.a[h]=[],b.f++);var k=Hc(c,d,f,g);-1<k?(b=c[k],e||(b.Wd=!1)):(b=new Dc(d,b.src,h,!!f,g),b.Wd=e,c.push(b));return b}Fc.prototype.remove=function(b,c,d,e){b=b.toString();if(!(b in this.a))return!1;var f=this.a[b];c=Hc(f,c,d,e);return-1<c?(Ec(f[c]),Za.splice.call(f,c,1),0==f.length&&(delete this.a[b],this.f--),!0):!1};
function Ic(b,c){var d=c.type;if(!(d in b.a))return!1;var e=gb(b.a[d],c);e&&(Ec(c),0==b.a[d].length&&(delete b.a[d],b.f--));return e}function Jc(b,c,d,e,f){b=b.a[c.toString()];c=-1;b&&(c=Hc(b,d,e,f));return-1<c?b[c]:null}function Kc(b,c,d){var e=ca(c),f=e?c.toString():"",g=ca(d);return Ib(b.a,function(b){for(var c=0;c<b.length;++c)if(!(e&&b[c].type!=f||g&&b[c].dd!=d))return!0;return!1})}
function Hc(b,c,d,e){for(var f=0;f<b.length;++f){var g=b[f];if(!g.Vc&&g.listener==c&&g.dd==!!d&&g.me==e)return f}return-1};var Lc="closure_lm_"+(1E6*Math.random()|0),Mc={},Nc=0;function D(b,c,d,e,f){if(ia(c)){for(var g=0;g<c.length;g++)D(b,c[g],d,e,f);return null}d=Oc(d);return Bc(b)?b.Sa(c,d,e,f):Pc(b,c,d,!1,e,f)}
function Pc(b,c,d,e,f,g){if(!c)throw Error("Invalid event type");var h=!!f,k=Qc(b);k||(b[Lc]=k=new Fc(b));d=Gc(k,c,d,e,f,g);if(d.a)return d;e=Rc();d.a=e;e.src=b;e.listener=d;if(b.addEventListener)b.addEventListener(c.toString(),e,h);else if(b.attachEvent)b.attachEvent(Sc(c.toString()),e);else throw Error("addEventListener and attachEvent are unavailable.");Nc++;return d}
function Rc(){var b=Tc,c=kc?function(d){return b.call(c.src,c.listener,d)}:function(d){d=b.call(c.src,c.listener,d);if(!d)return d};return c}function Uc(b,c,d,e,f){if(ia(c)){for(var g=0;g<c.length;g++)Uc(b,c[g],d,e,f);return null}d=Oc(d);return Bc(b)?Gc(b.Ab,String(c),d,!0,e,f):Pc(b,c,d,!0,e,f)}function Vc(b,c,d,e,f){if(ia(c))for(var g=0;g<c.length;g++)Vc(b,c[g],d,e,f);else d=Oc(d),Bc(b)?b.$f(c,d,e,f):b&&(b=Qc(b))&&(c=Jc(b,c,d,!!e,f))&&Wc(c)}
function Wc(b){if(ma(b)||!b||b.Vc)return!1;var c=b.src;if(Bc(c))return Ic(c.Ab,b);var d=b.type,e=b.a;c.removeEventListener?c.removeEventListener(d,e,b.dd):c.detachEvent&&c.detachEvent(Sc(d),e);Nc--;(d=Qc(c))?(Ic(d,b),0==d.f&&(d.src=null,c[Lc]=null)):Ec(b);return!0}function Sc(b){return b in Mc?Mc[b]:Mc[b]="on"+b}function Xc(b,c,d,e){var f=!0;if(b=Qc(b))if(c=b.a[c.toString()])for(c=c.concat(),b=0;b<c.length;b++){var g=c[b];g&&g.dd==d&&!g.Vc&&(g=Yc(g,e),f=f&&!1!==g)}return f}
function Yc(b,c){var d=b.listener,e=b.me||b.src;b.Wd&&Wc(b);return d.call(e,c)}
function Tc(b,c){if(b.Vc)return!0;if(!kc){var d;if(!(d=c))a:{d=["window","event"];for(var e=ba,f;f=d.shift();)if(null!=e[f])e=e[f];else{d=null;break a}d=e}f=d;d=new wc(f,this);e=!0;if(!(0>f.keyCode||void 0!=f.returnValue)){a:{var g=!1;if(0==f.keyCode)try{f.keyCode=-1;break a}catch(m){g=!0}if(g||void 0==f.returnValue)f.returnValue=!0}f=[];for(g=d.g;g;g=g.parentNode)f.push(g);for(var g=b.type,h=f.length-1;!d.j&&0<=h;h--){d.g=f[h];var k=Xc(f[h],g,!0,d),e=e&&k}for(h=0;!d.j&&h<f.length;h++)d.g=f[h],k=
Xc(f[h],g,!1,d),e=e&&k}return e}return Yc(b,new wc(c,this))}function Qc(b){b=b[Lc];return b instanceof Fc?b:null}var Zc="__closure_events_fn_"+(1E9*Math.random()>>>0);function Oc(b){if(na(b))return b;b[Zc]||(b[Zc]=function(c){return b.handleEvent(c)});return b[Zc]};function $c(){mc.call(this);this.Ab=new Fc(this);this.Pd=this;this.ib=null}z($c,mc);$c.prototype[Ac]=!0;l=$c.prototype;l.addEventListener=function(b,c,d,e){D(this,b,c,d,e)};l.removeEventListener=function(b,c,d,e){Vc(this,b,c,d,e)};
l.s=function(b){var c,d=this.ib;if(d)for(c=[];d;d=d.ib)c.push(d);var d=this.Pd,e=b.type||b;if(la(b))b=new rc(b,d);else if(b instanceof rc)b.target=b.target||d;else{var f=b;b=new rc(e,d);Ub(b,f)}var f=!0,g;if(c)for(var h=c.length-1;!b.j&&0<=h;h--)g=b.g=c[h],f=ad(g,e,!0,b)&&f;b.j||(g=b.g=d,f=ad(g,e,!0,b)&&f,b.j||(f=ad(g,e,!1,b)&&f));if(c)for(h=0;!b.j&&h<c.length;h++)g=b.g=c[h],f=ad(g,e,!1,b)&&f;return f};
l.X=function(){$c.da.X.call(this);if(this.Ab){var b=this.Ab,c=0,d;for(d in b.a){for(var e=b.a[d],f=0;f<e.length;f++)++c,Ec(e[f]);delete b.a[d];b.f--}}this.ib=null};l.Sa=function(b,c,d,e){return Gc(this.Ab,String(b),c,!1,d,e)};l.$f=function(b,c,d,e){return this.Ab.remove(String(b),c,d,e)};
function ad(b,c,d,e){c=b.Ab.a[String(c)];if(!c)return!0;c=c.concat();for(var f=!0,g=0;g<c.length;++g){var h=c[g];if(h&&!h.Vc&&h.dd==d){var k=h.listener,m=h.me||h.src;h.Wd&&Ic(b.Ab,h);f=!1!==k.call(m,e)&&f}}return f&&0!=e.Zh}function bd(b,c,d){return Kc(b.Ab,ca(c)?String(c):void 0,d)};function cd(){$c.call(this);this.f=0}z(cd,$c);function dd(b){Wc(b)}l=cd.prototype;l.u=function(){++this.f;this.s("change")};l.L=function(){return this.f};l.H=function(b,c,d){return D(this,b,c,!1,d)};l.M=function(b,c,d){return Uc(this,b,c,!1,d)};l.K=function(b,c,d){Vc(this,b,c,!1,d)};l.N=dd;function ed(b,c,d){rc.call(this,b);this.key=c;this.oldValue=d}z(ed,rc);function fd(b){cd.call(this);w(this);this.G={};void 0!==b&&this.I(b)}z(fd,cd);var gd={};function hd(b){return gd.hasOwnProperty(b)?gd[b]:gd[b]="change:"+b}l=fd.prototype;l.get=function(b){var c;this.G.hasOwnProperty(b)&&(c=this.G[b]);return c};l.P=function(){return Object.keys(this.G)};l.R=function(){var b={},c;for(c in this.G)b[c]=this.G[c];return b};
function id(b,c,d){var e;e=hd(c);b.s(new ed(e,c,d));b.s(new ed("propertychange",c,d))}l.set=function(b,c,d){d?this.G[b]=c:(d=this.G[b],this.G[b]=c,d!==c&&id(this,b,d))};l.I=function(b,c){for(var d in b)this.set(d,b[d],c)};l.S=function(b,c){if(b in this.G){var d=this.G[b];delete this.G[b];c||id(this,b,d)}};function jd(b,c,d){void 0===d&&(d=[0,0]);d[0]=b[0]+2*c;d[1]=b[1]+2*c;return d}function kd(b,c,d){void 0===d&&(d=[0,0]);d[0]=b[0]*c+.5|0;d[1]=b[1]*c+.5|0;return d}function ld(b,c){if(ia(b))return b;void 0===c?c=[b,b]:(c[0]=b,c[1]=b);return c};function md(b,c){var d=b%c;return 0>d*c?d+c:d}function nd(b,c,d){return b+d*(c-b)};function od(b,c){b[0]+=c[0];b[1]+=c[1];return b}function pd(b,c){var d=b[0],e=b[1],f=c[0],g=c[1],h=f[0],f=f[1],k=g[0],g=g[1],m=k-h,n=g-f,d=0===m&&0===n?0:(m*(d-h)+n*(e-f))/(m*m+n*n||0);0>=d||(1<=d?(h=k,f=g):(h+=d*m,f+=d*n));return[h,f]}function qd(b,c){var d=md(b+180,360)-180,e=Math.abs(Math.round(3600*d));return Math.floor(e/3600)+"\u00b0 "+Oa(Math.floor(e/60%60))+"\u2032 "+Oa(Math.floor(e%60))+"\u2033 "+c.charAt(0>d?1:0)}
function rd(b,c,d){return b?c.replace("{x}",b[0].toFixed(d)).replace("{y}",b[1].toFixed(d)):""}function sd(b,c){for(var d=!0,e=b.length-1;0<=e;--e)if(b[e]!=c[e]){d=!1;break}return d}function td(b,c){var d=Math.cos(c),e=Math.sin(c),f=b[1]*d+b[0]*e;b[0]=b[0]*d-b[1]*e;b[1]=f;return b}function ud(b,c){var d=b[0]-c[0],e=b[1]-c[1];return d*d+e*e}function vd(b,c){return ud(b,pd(b,c))}function wd(b,c){return rd(b,"{x}, {y}",c)};function xd(b){this.length=b.length||b;for(var c=0;c<this.length;c++)this[c]=b[c]||0}xd.prototype.a=4;xd.prototype.set=function(b,c){c=c||0;for(var d=0;d<b.length&&c+d<this.length;d++)this[c+d]=b[d]};xd.prototype.toString=Array.prototype.join;"undefined"==typeof Float32Array&&(xd.BYTES_PER_ELEMENT=4,xd.prototype.BYTES_PER_ELEMENT=xd.prototype.a,xd.prototype.set=xd.prototype.set,xd.prototype.toString=xd.prototype.toString,u("Float32Array",xd,void 0));function yd(b){this.length=b.length||b;for(var c=0;c<this.length;c++)this[c]=b[c]||0}yd.prototype.a=8;yd.prototype.set=function(b,c){c=c||0;for(var d=0;d<b.length&&c+d<this.length;d++)this[c+d]=b[d]};yd.prototype.toString=Array.prototype.join;if("undefined"==typeof Float64Array){try{yd.BYTES_PER_ELEMENT=8}catch(b){}yd.prototype.BYTES_PER_ELEMENT=yd.prototype.a;yd.prototype.set=yd.prototype.set;yd.prototype.toString=yd.prototype.toString;u("Float64Array",yd,void 0)};function zd(b,c,d,e,f){b[0]=c;b[1]=d;b[2]=e;b[3]=f};function Ad(){var b=Array(16);Bd(b,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0);return b}function Cd(){var b=Array(16);Bd(b,1,0,0,0,0,1,0,0,0,0,1,0,0,0,0,1);return b}function Bd(b,c,d,e,f,g,h,k,m,n,p,q,r,t,v,x,C){b[0]=c;b[1]=d;b[2]=e;b[3]=f;b[4]=g;b[5]=h;b[6]=k;b[7]=m;b[8]=n;b[9]=p;b[10]=q;b[11]=r;b[12]=t;b[13]=v;b[14]=x;b[15]=C}
function Dd(b,c){b[0]=c[0];b[1]=c[1];b[2]=c[2];b[3]=c[3];b[4]=c[4];b[5]=c[5];b[6]=c[6];b[7]=c[7];b[8]=c[8];b[9]=c[9];b[10]=c[10];b[11]=c[11];b[12]=c[12];b[13]=c[13];b[14]=c[14];b[15]=c[15]}function Ed(b){b[0]=1;b[1]=0;b[2]=0;b[3]=0;b[4]=0;b[5]=1;b[6]=0;b[7]=0;b[8]=0;b[9]=0;b[10]=1;b[11]=0;b[12]=0;b[13]=0;b[14]=0;b[15]=1}
function Fd(b,c,d){var e=b[0],f=b[1],g=b[2],h=b[3],k=b[4],m=b[5],n=b[6],p=b[7],q=b[8],r=b[9],t=b[10],v=b[11],x=b[12],C=b[13],A=b[14];b=b[15];var y=c[0],B=c[1],M=c[2],K=c[3],E=c[4],P=c[5],fa=c[6],I=c[7],ga=c[8],Ja=c[9],Sa=c[10],R=c[11],ja=c[12],sc=c[13],zc=c[14];c=c[15];d[0]=e*y+k*B+q*M+x*K;d[1]=f*y+m*B+r*M+C*K;d[2]=g*y+n*B+t*M+A*K;d[3]=h*y+p*B+v*M+b*K;d[4]=e*E+k*P+q*fa+x*I;d[5]=f*E+m*P+r*fa+C*I;d[6]=g*E+n*P+t*fa+A*I;d[7]=h*E+p*P+v*fa+b*I;d[8]=e*ga+k*Ja+q*Sa+x*R;d[9]=f*ga+m*Ja+r*Sa+C*R;d[10]=g*ga+
n*Ja+t*Sa+A*R;d[11]=h*ga+p*Ja+v*Sa+b*R;d[12]=e*ja+k*sc+q*zc+x*c;d[13]=f*ja+m*sc+r*zc+C*c;d[14]=g*ja+n*sc+t*zc+A*c;d[15]=h*ja+p*sc+v*zc+b*c}
function Gd(b,c){var d=b[0],e=b[1],f=b[2],g=b[3],h=b[4],k=b[5],m=b[6],n=b[7],p=b[8],q=b[9],r=b[10],t=b[11],v=b[12],x=b[13],C=b[14],A=b[15],y=d*k-e*h,B=d*m-f*h,M=d*n-g*h,K=e*m-f*k,E=e*n-g*k,P=f*n-g*m,fa=p*x-q*v,I=p*C-r*v,ga=p*A-t*v,Ja=q*C-r*x,Sa=q*A-t*x,R=r*A-t*C,ja=y*R-B*Sa+M*Ja+K*ga-E*I+P*fa;0!=ja&&(ja=1/ja,c[0]=(k*R-m*Sa+n*Ja)*ja,c[1]=(-e*R+f*Sa-g*Ja)*ja,c[2]=(x*P-C*E+A*K)*ja,c[3]=(-q*P+r*E-t*K)*ja,c[4]=(-h*R+m*ga-n*I)*ja,c[5]=(d*R-f*ga+g*I)*ja,c[6]=(-v*P+C*M-A*B)*ja,c[7]=(p*P-r*M+t*B)*ja,c[8]=
(h*Sa-k*ga+n*fa)*ja,c[9]=(-d*Sa+e*ga-g*fa)*ja,c[10]=(v*E-x*M+A*y)*ja,c[11]=(-p*E+q*M-t*y)*ja,c[12]=(-h*Ja+k*I-m*fa)*ja,c[13]=(d*Ja-e*I+f*fa)*ja,c[14]=(-v*K+x*B-C*y)*ja,c[15]=(p*K-q*B+r*y)*ja)}function Hd(b,c,d){var e=b[1]*c+b[5]*d+0*b[9]+b[13],f=b[2]*c+b[6]*d+0*b[10]+b[14],g=b[3]*c+b[7]*d+0*b[11]+b[15];b[12]=b[0]*c+b[4]*d+0*b[8]+b[12];b[13]=e;b[14]=f;b[15]=g}function Id(b,c,d){Bd(b,b[0]*c,b[1]*c,b[2]*c,b[3]*c,b[4]*d,b[5]*d,b[6]*d,b[7]*d,1*b[8],1*b[9],1*b[10],1*b[11],b[12],b[13],b[14],b[15])}
function Jd(b,c){var d=b[0],e=b[1],f=b[2],g=b[3],h=b[4],k=b[5],m=b[6],n=b[7],p=Math.cos(c),q=Math.sin(c);b[0]=d*p+h*q;b[1]=e*p+k*q;b[2]=f*p+m*q;b[3]=g*p+n*q;b[4]=d*-q+h*p;b[5]=e*-q+k*p;b[6]=f*-q+m*p;b[7]=g*-q+n*p}new Float64Array(3);new Float64Array(3);new Float64Array(4);new Float64Array(4);new Float64Array(4);new Float64Array(16);function Kd(b){for(var c=Ld(),d=0,e=b.length;d<e;++d)Md(c,b[d]);return c}function Nd(b,c,d){var e=Math.min.apply(null,b),f=Math.min.apply(null,c);b=Math.max.apply(null,b);c=Math.max.apply(null,c);return Od(e,f,b,c,d)}function Pd(b,c,d){return d?(d[0]=b[0]-c,d[1]=b[1]-c,d[2]=b[2]+c,d[3]=b[3]+c,d):[b[0]-c,b[1]-c,b[2]+c,b[3]+c]}function Qd(b,c){return c?(c[0]=b[0],c[1]=b[1],c[2]=b[2],c[3]=b[3],c):b.slice()}
function Rd(b,c,d){c=c<b[0]?b[0]-c:b[2]<c?c-b[2]:0;b=d<b[1]?b[1]-d:b[3]<d?d-b[3]:0;return c*c+b*b}function Sd(b,c){return Td(b,c[0],c[1])}function Ud(b,c){return b[0]<=c[0]&&c[2]<=b[2]&&b[1]<=c[1]&&c[3]<=b[3]}function Td(b,c,d){return b[0]<=c&&c<=b[2]&&b[1]<=d&&d<=b[3]}function Vd(b,c){var d=b[1],e=b[2],f=b[3],g=c[0],h=c[1],k=0;g<b[0]?k=k|16:g>e&&(k=k|4);h<d?k|=8:h>f&&(k|=2);0===k&&(k=1);return k}function Ld(){return[Infinity,Infinity,-Infinity,-Infinity]}
function Od(b,c,d,e,f){return f?(f[0]=b,f[1]=c,f[2]=d,f[3]=e,f):[b,c,d,e]}function Wd(b,c){var d=b[0],e=b[1];return Od(d,e,d,e,c)}function Xd(b,c,d,e,f){f=Od(Infinity,Infinity,-Infinity,-Infinity,f);return Yd(f,b,c,d,e)}function $d(b,c){return b[0]==c[0]&&b[2]==c[2]&&b[1]==c[1]&&b[3]==c[3]}function ae(b,c){c[0]<b[0]&&(b[0]=c[0]);c[2]>b[2]&&(b[2]=c[2]);c[1]<b[1]&&(b[1]=c[1]);c[3]>b[3]&&(b[3]=c[3]);return b}
function Md(b,c){c[0]<b[0]&&(b[0]=c[0]);c[0]>b[2]&&(b[2]=c[0]);c[1]<b[1]&&(b[1]=c[1]);c[1]>b[3]&&(b[3]=c[1])}function Yd(b,c,d,e,f){for(;d<e;d+=f){var g=b,h=c[d],k=c[d+1];g[0]=Math.min(g[0],h);g[1]=Math.min(g[1],k);g[2]=Math.max(g[2],h);g[3]=Math.max(g[3],k)}return b}function be(b,c,d){var e;return(e=c.call(d,ce(b)))||(e=c.call(d,de(b)))||(e=c.call(d,ee(b)))?e:(e=c.call(d,fe(b)))?e:!1}function ge(b){var c=0;he(b)||(c=ie(b)*je(b));return c}function ce(b){return[b[0],b[1]]}
function de(b){return[b[2],b[1]]}function ke(b){return[(b[0]+b[2])/2,(b[1]+b[3])/2]}function le(b,c,d,e){var f=c*e[0]/2;e=c*e[1]/2;c=Math.cos(d);d=Math.sin(d);f=[-f,-f,f,f];e=[-e,e,-e,e];var g,h,k;for(g=0;4>g;++g)h=f[g],k=e[g],f[g]=b[0]+h*c-k*d,e[g]=b[1]+h*d+k*c;return Nd(f,e,void 0)}function je(b){return b[3]-b[1]}function me(b,c,d){d=d?d:Ld();ne(b,c)&&(d[0]=b[0]>c[0]?b[0]:c[0],d[1]=b[1]>c[1]?b[1]:c[1],d[2]=b[2]<c[2]?b[2]:c[2],d[3]=b[3]<c[3]?b[3]:c[3]);return d}function fe(b){return[b[0],b[3]]}
function ee(b){return[b[2],b[3]]}function ie(b){return b[2]-b[0]}function ne(b,c){return b[0]<=c[2]&&b[2]>=c[0]&&b[1]<=c[3]&&b[3]>=c[1]}function he(b){return b[2]<b[0]||b[3]<b[1]}function oe(b,c){var d=(b[2]-b[0])/2*(c-1),e=(b[3]-b[1])/2*(c-1);b[0]-=d;b[2]+=d;b[1]-=e;b[3]+=e}function pe(b,c,d){b=[b[0],b[1],b[0],b[3],b[2],b[1],b[2],b[3]];c(b,b,2);return Nd([b[0],b[2],b[4],b[6]],[b[1],b[3],b[5],b[7]],d)};function qe(b){return function(){return b}}var re=qe(!1),se=qe(!0),te=qe(null);function ue(b){return b}function ve(b){var c;c=c||0;return function(){return b.apply(this,Array.prototype.slice.call(arguments,0,c))}}function we(b){var c=arguments,d=c.length;return function(){for(var b,f=0;f<d;f++)b=c[f].apply(this,arguments);return b}}function xe(b){var c=arguments,d=c.length;return function(){for(var b=0;b<d;b++)if(!c[b].apply(this,arguments))return!1;return!0}};/*

 Latitude/longitude spherical geodesy formulae taken from
 http://www.movable-type.co.uk/scripts/latlong.html
 Licensed under CC-BY-3.0.
*/
function ye(b){this.radius=b}ye.prototype.f=function(b){for(var c=0,d=b.length,e=b[d-1][0],f=b[d-1][1],g=0;g<d;g++)var h=b[g][0],k=b[g][1],c=c+Wa(h-e)*(2+Math.sin(Wa(f))+Math.sin(Wa(k))),e=h,f=k;return c*this.radius*this.radius/2};ye.prototype.a=function(b,c){var d=Wa(b[1]),e=Wa(c[1]),f=(e-d)/2,g=Wa(c[0]-b[0])/2,d=Math.sin(f)*Math.sin(f)+Math.sin(g)*Math.sin(g)*Math.cos(d)*Math.cos(e);return 2*this.radius*Math.atan2(Math.sqrt(d),Math.sqrt(1-d))};
ye.prototype.offset=function(b,c,d){var e=Wa(b[1]);c/=this.radius;var f=Math.asin(Math.sin(e)*Math.cos(c)+Math.cos(e)*Math.sin(c)*Math.cos(d));return[180*(Wa(b[0])+Math.atan2(Math.sin(d)*Math.sin(c)*Math.cos(e),Math.cos(c)-Math.sin(e)*Math.sin(f)))/Math.PI,180*f/Math.PI]};var ze=new ye(6370997);var Ae={};Ae.degrees=2*Math.PI*ze.radius/360;Ae.ft=.3048;Ae.m=1;Ae["us-ft"]=1200/3937;
function Be(b){this.Ya=b.code;this.a=b.units;this.g=void 0!==b.extent?b.extent:null;this.i=void 0!==b.worldExtent?b.worldExtent:null;this.c=void 0!==b.axisOrientation?b.axisOrientation:"enu";this.b=void 0!==b.global?b.global:!1;this.f=!(!this.b||!this.g);this.l=void 0!==b.getPointResolution?b.getPointResolution:this.nk;this.j=null;this.o=b.metersPerUnit;var c=Ce,d=b.code,e=De||ba.proj4;if("function"==typeof e&&void 0===c[d]){var f=e.defs(d);if(void 0!==f){void 0!==f.axis&&void 0===b.axisOrientation&&
(this.c=f.axis);void 0===b.metersPerUnit&&(this.o=f.to_meter);void 0===b.units&&(this.a=f.units);for(var g in c)c=e.defs(g),void 0!==c&&(b=Ee(g),c===f?Fe([b,this]):(c=e(g,d),Ge(b,this,c.forward,c.inverse)))}}}l=Be.prototype;l.Pj=function(){return this.Ya};l.J=function(){return this.g};l.Im=function(){return this.a};l.$b=function(){return this.o||Ae[this.a]};l.zk=function(){return this.i};function He(b){return b.c}l.ol=function(){return this.b};l.Vo=function(b){this.b=b;this.f=!(!b||!this.g)};
l.Jm=function(b){this.g=b;this.f=!(!this.b||!b)};l.cp=function(b){this.i=b};l.Uo=function(b){this.l=b};l.nk=function(b,c){if("degrees"==this.a)return b;var d=Ie(this,Ee("EPSG:4326")),e=[c[0]-b/2,c[1],c[0]+b/2,c[1],c[0],c[1]-b/2,c[0],c[1]+b/2],e=d(e,e,2),d=ze.a(e.slice(0,2),e.slice(2,4)),e=ze.a(e.slice(4,6),e.slice(6,8)),e=(d+e)/2,d=this.$b();void 0!==d&&(e/=d);return e};l.getPointResolution=function(b,c){return this.l(b,c)};var Ce={},Je={},De=null;
function Fe(b){Ke(b);b.forEach(function(c){b.forEach(function(b){c!==b&&Le(c,b,Me)})})}function Ne(){var b=Oe,c=Pe,d=Qe;Re.forEach(function(e){b.forEach(function(b){Le(e,b,c);Le(b,e,d)})})}function Se(b){Ce[b.Ya]=b;Le(b,b,Me)}function Ke(b){var c=[];b.forEach(function(b){c.push(Se(b))})}function Te(b){return b?la(b)?Ee(b):b:Ee("EPSG:3857")}function Le(b,c,d){b=b.Ya;c=c.Ya;b in Je||(Je[b]={});Je[b][c]=d}function Ge(b,c,d,e){b=Ee(b);c=Ee(c);Le(b,c,Ue(d));Le(c,b,Ue(e))}
function Ue(b){return function(c,d,e){var f=c.length;e=void 0!==e?e:2;d=void 0!==d?d:Array(f);var g,h;for(h=0;h<f;h+=e)for(g=b([c[h],c[h+1]]),d[h]=g[0],d[h+1]=g[1],g=e-1;2<=g;--g)d[h+g]=c[h+g];return d}}function Ee(b){var c;if(b instanceof Be)c=b;else if(la(b)){c=Ce[b];var d=De||ba.proj4;void 0===c&&"function"==typeof d&&void 0!==d.defs(b)&&(c=new Be({code:b}),Se(c))}else c=null;return c}function Ve(b,c){if(b===c)return!0;var d=b.a===c.a;return b.Ya===c.Ya?d:Ie(b,c)===Me&&d}
function We(b,c){var d=Ee(b),e=Ee(c);return Ie(d,e)}function Ie(b,c){var d=b.Ya,e=c.Ya,f;d in Je&&e in Je[d]&&(f=Je[d][e]);void 0===f&&(f=Xe);return f}function Xe(b,c){if(void 0!==c&&b!==c){for(var d=0,e=b.length;d<e;++d)c[d]=b[d];b=c}return b}function Me(b,c){var d;if(void 0!==c){d=0;for(var e=b.length;d<e;++d)c[d]=b[d];d=c}else d=b.slice();return d}function Ye(b,c,d){return We(c,d)(b,void 0,b.length)}function Ze(b,c,d){c=We(c,d);return pe(b,c)};function $e(){fd.call(this);this.B=Ld();this.v=-1;this.i={};this.o=this.j=0}z($e,fd);l=$e.prototype;l.sb=function(b,c){var d=c?c:[NaN,NaN];this.pb(b[0],b[1],d,Infinity);return d};l.sg=function(b){return this.yc(b[0],b[1])};l.yc=re;l.J=function(b){this.v!=this.f&&(this.B=this.Xd(this.B),this.v=this.f);var c=this.B;b?(b[0]=c[0],b[1]=c[1],b[2]=c[2],b[3]=c[3]):b=c;return b};l.zb=function(b){return this.vd(b*b)};l.nb=function(b,c){this.qc(We(b,c));return this};function af(b,c,d,e,f,g){var h=f[0],k=f[1],m=f[4],n=f[5],p=f[12];f=f[13];for(var q=g?g:[],r=0;c<d;c+=e){var t=b[c],v=b[c+1];q[r++]=h*t+m*v+p;q[r++]=k*t+n*v+f}g&&q.length!=r&&(q.length=r);return q};function bf(){$e.call(this);this.b="XY";this.a=2;this.A=null}z(bf,$e);function cf(b){if("XY"==b)return 2;if("XYZ"==b||"XYM"==b)return 3;if("XYZM"==b)return 4}l=bf.prototype;l.yc=re;l.Xd=function(b){return Xd(this.A,0,this.A.length,this.a,b)};l.Lb=function(){return this.A.slice(0,this.a)};l.ja=function(){return this.A};l.Mb=function(){return this.A.slice(this.A.length-this.a)};l.Nb=function(){return this.b};
l.vd=function(b){this.o!=this.f&&(Ob(this.i),this.j=0,this.o=this.f);if(0>b||0!==this.j&&b<=this.j)return this;var c=b.toString();if(this.i.hasOwnProperty(c))return this.i[c];var d=this.Nc(b);if(d.ja().length<this.A.length)return this.i[c]=d;this.j=b;return this};l.Nc=function(){return this};l.sa=function(){return this.a};function df(b,c,d){b.a=cf(c);b.b=c;b.A=d}
function ef(b,c,d,e){if(c)d=cf(c);else{for(c=0;c<e;++c){if(0===d.length){b.b="XY";b.a=2;return}d=d[0]}d=d.length;c=2==d?"XY":3==d?"XYZ":4==d?"XYZM":void 0}b.b=c;b.a=d}l.qc=function(b){this.A&&(b(this.A,this.A,this.a),this.u())};l.Qc=function(b,c){var d=this.ja();if(d){var e=d.length,f=this.sa(),g=d?d:[],h=0,k,m;for(k=0;k<e;k+=f)for(g[h++]=d[k]+b,g[h++]=d[k+1]+c,m=k+2;m<k+f;++m)g[h++]=d[m];d&&g.length!=h&&(g.length=h);this.u()}};function ff(b,c,d,e){for(var f=0,g=b[d-e],h=b[d-e+1];c<d;c+=e)var k=b[c],m=b[c+1],f=f+(h*k-g*m),g=k,h=m;return f/2}function gf(b,c,d,e){var f=0,g,h;g=0;for(h=d.length;g<h;++g){var k=d[g],f=f+ff(b,c,k,e);c=k}return f};function hf(b,c,d,e,f,g,h){var k=b[c],m=b[c+1],n=b[d]-k,p=b[d+1]-m;if(0!==n||0!==p)if(g=((f-k)*n+(g-m)*p)/(n*n+p*p),1<g)c=d;else if(0<g){for(f=0;f<e;++f)h[f]=nd(b[c+f],b[d+f],g);h.length=e;return}for(f=0;f<e;++f)h[f]=b[c+f];h.length=e}function jf(b,c,d,e,f){var g=b[c],h=b[c+1];for(c+=e;c<d;c+=e){var k=b[c],m=b[c+1],g=Va(g,h,k,m);g>f&&(f=g);g=k;h=m}return f}function kf(b,c,d,e,f){var g,h;g=0;for(h=d.length;g<h;++g){var k=d[g];f=jf(b,c,k,e,f);c=k}return f}
function lf(b,c,d,e,f,g,h,k,m,n,p){if(c==d)return n;var q;if(0===f){q=Va(h,k,b[c],b[c+1]);if(q<n){for(p=0;p<e;++p)m[p]=b[c+p];m.length=e;return q}return n}for(var r=p?p:[NaN,NaN],t=c+e;t<d;)if(hf(b,t-e,t,e,h,k,r),q=Va(h,k,r[0],r[1]),q<n){n=q;for(p=0;p<e;++p)m[p]=r[p];m.length=e;t+=e}else t+=e*Math.max((Math.sqrt(q)-Math.sqrt(n))/f|0,1);if(g&&(hf(b,d-e,c,e,h,k,r),q=Va(h,k,r[0],r[1]),q<n)){n=q;for(p=0;p<e;++p)m[p]=r[p];m.length=e}return n}
function mf(b,c,d,e,f,g,h,k,m,n,p){p=p?p:[NaN,NaN];var q,r;q=0;for(r=d.length;q<r;++q){var t=d[q];n=lf(b,c,t,e,f,g,h,k,m,n,p);c=t}return n};function nf(b,c){var d=0,e,f;e=0;for(f=c.length;e<f;++e)b[d++]=c[e];return d}function of(b,c,d,e){var f,g;f=0;for(g=d.length;f<g;++f){var h=d[f],k;for(k=0;k<e;++k)b[c++]=h[k]}return c}function pf(b,c,d,e,f){f=f?f:[];var g=0,h,k;h=0;for(k=d.length;h<k;++h)c=of(b,c,d[h],e),f[g++]=c;f.length=g;return f};function qf(b,c,d,e,f){f=void 0!==f?f:[];for(var g=0;c<d;c+=e)f[g++]=b.slice(c,c+e);f.length=g;return f}function rf(b,c,d,e,f){f=void 0!==f?f:[];var g=0,h,k;h=0;for(k=d.length;h<k;++h){var m=d[h];f[g++]=qf(b,c,m,e,f[g]);c=m}f.length=g;return f};function sf(b,c,d,e,f,g,h){var k=(d-c)/e;if(3>k){for(;c<d;c+=e)g[h++]=b[c],g[h++]=b[c+1];return h}var m=Array(k);m[0]=1;m[k-1]=1;d=[c,d-e];for(var n=0,p;0<d.length;){var q=d.pop(),r=d.pop(),t=0,v=b[r],x=b[r+1],C=b[q],A=b[q+1];for(p=r+e;p<q;p+=e){var y=Ua(b[p],b[p+1],v,x,C,A);y>t&&(n=p,t=y)}t>f&&(m[(n-c)/e]=1,r+e<n&&d.push(r,n),n+e<q&&d.push(n,q))}for(p=0;p<k;++p)m[p]&&(g[h++]=b[c+p*e],g[h++]=b[c+p*e+1]);return h}
function tf(b,c,d,e,f,g,h,k){var m,n;m=0;for(n=d.length;m<n;++m){var p=d[m];a:{var q=b,r=p,t=e,v=f,x=g;if(c!=r){var C=v*Math.round(q[c]/v),A=v*Math.round(q[c+1]/v);c+=t;x[h++]=C;x[h++]=A;var y=void 0,B=void 0;do if(y=v*Math.round(q[c]/v),B=v*Math.round(q[c+1]/v),c+=t,c==r){x[h++]=y;x[h++]=B;break a}while(y==C&&B==A);for(;c<r;){var M,K;M=v*Math.round(q[c]/v);K=v*Math.round(q[c+1]/v);c+=t;if(M!=y||K!=B){var E=y-C,P=B-A,fa=M-C,I=K-A;E*I==P*fa&&(0>E&&fa<E||E==fa||0<E&&fa>E)&&(0>P&&I<P||P==I||0<P&&I>P)||
(x[h++]=y,x[h++]=B,C=y,A=B);y=M;B=K}}x[h++]=y;x[h++]=B}}k.push(h);c=p}return h};function vf(b,c){bf.call(this);this.g=this.l=-1;this.ma(b,c)}z(vf,bf);l=vf.prototype;l.clone=function(){var b=new vf(null);wf(b,this.b,this.A.slice());return b};l.pb=function(b,c,d,e){if(e<Rd(this.J(),b,c))return e;this.g!=this.f&&(this.l=Math.sqrt(jf(this.A,0,this.A.length,this.a,0)),this.g=this.f);return lf(this.A,0,this.A.length,this.a,this.l,!0,b,c,d,e)};l.jm=function(){return ff(this.A,0,this.A.length,this.a)};l.Z=function(){return qf(this.A,0,this.A.length,this.a)};
l.Nc=function(b){var c=[];c.length=sf(this.A,0,this.A.length,this.a,b,c,0);b=new vf(null);wf(b,"XY",c);return b};l.V=function(){return"LinearRing"};l.ma=function(b,c){b?(ef(this,c,b,1),this.A||(this.A=[]),this.A.length=of(this.A,0,b,this.a),this.u()):wf(this,"XY",null)};function wf(b,c,d){df(b,c,d);b.u()};function F(b,c){bf.call(this);this.ma(b,c)}z(F,bf);l=F.prototype;l.clone=function(){var b=new F(null);b.ba(this.b,this.A.slice());return b};l.pb=function(b,c,d,e){var f=this.A;b=Va(b,c,f[0],f[1]);if(b<e){e=this.a;for(c=0;c<e;++c)d[c]=f[c];d.length=e;return b}return e};l.Z=function(){return this.A?this.A.slice():[]};l.Xd=function(b){return Wd(this.A,b)};l.V=function(){return"Point"};l.Fa=function(b){return Td(b,this.A[0],this.A[1])};
l.ma=function(b,c){b?(ef(this,c,b,0),this.A||(this.A=[]),this.A.length=nf(this.A,b),this.u()):this.ba("XY",null)};l.ba=function(b,c){df(this,b,c);this.u()};function xf(b,c,d,e,f){return!be(f,function(f){return!yf(b,c,d,e,f[0],f[1])})}function yf(b,c,d,e,f,g){for(var h=!1,k=b[d-e],m=b[d-e+1];c<d;c+=e){var n=b[c],p=b[c+1];m>g!=p>g&&f<(n-k)*(g-m)/(p-m)+k&&(h=!h);k=n;m=p}return h}function zf(b,c,d,e,f,g){if(0===d.length||!yf(b,c,d[0],e,f,g))return!1;var h;c=1;for(h=d.length;c<h;++c)if(yf(b,d[c-1],d[c],e,f,g))return!1;return!0};function Af(b,c,d,e,f,g,h){var k,m,n,p,q,r=f[g+1],t=[],v=d[0];n=b[v-e];q=b[v-e+1];for(k=c;k<v;k+=e){p=b[k];m=b[k+1];if(r<=q&&m<=r||q<=r&&r<=m)n=(r-q)/(m-q)*(p-n)+n,t.push(n);n=p;q=m}v=NaN;q=-Infinity;t.sort(tb);n=t[0];k=1;for(m=t.length;k<m;++k){p=t[k];var x=Math.abs(p-n);x>q&&(n=(n+p)/2,zf(b,c,d,e,n,r)&&(v=n,q=x));n=p}isNaN(v)&&(v=f[g]);return h?(h.push(v,r),h):[v,r]};function Bf(b,c,d,e,f,g){for(var h=[b[c],b[c+1]],k=[],m;c+e<d;c+=e){k[0]=b[c+e];k[1]=b[c+e+1];if(m=f.call(g,h,k))return m;h[0]=k[0];h[1]=k[1]}return!1};function Cf(b,c,d,e,f){var g=Yd(Ld(),b,c,d,e);return ne(f,g)?Ud(f,g)||g[0]>=f[0]&&g[2]<=f[2]||g[1]>=f[1]&&g[3]<=f[3]?!0:Bf(b,c,d,e,function(b,c){var d=!1,e=Vd(f,b),g=Vd(f,c);if(1===e||1===g)d=!0;else{var q=f[0],r=f[1],t=f[2],v=f[3],x=c[0],C=c[1],A=(C-b[1])/(x-b[0]);g&2&&!(e&2)&&(d=x-(C-v)/A,d=d>=q&&d<=t);d||!(g&4)||e&4||(d=C-(x-t)*A,d=d>=r&&d<=v);d||!(g&8)||e&8||(d=x-(C-r)/A,d=d>=q&&d<=t);d||!(g&16)||e&16||(d=C-(x-q)*A,d=d>=r&&d<=v)}return d}):!1}
function Df(b,c,d,e,f){var g=d[0];if(!(Cf(b,c,g,e,f)||yf(b,c,g,e,f[0],f[1])||yf(b,c,g,e,f[0],f[3])||yf(b,c,g,e,f[2],f[1])||yf(b,c,g,e,f[2],f[3])))return!1;if(1===d.length)return!0;c=1;for(g=d.length;c<g;++c)if(xf(b,d[c-1],d[c],e,f))return!1;return!0};function Ef(b,c,d,e){for(var f=0,g=b[d-e],h=b[d-e+1];c<d;c+=e)var k=b[c],m=b[c+1],f=f+(k-g)*(m+h),g=k,h=m;return 0<f}function Ff(b,c,d,e){var f=0;e=void 0!==e?e:!1;var g,h;g=0;for(h=c.length;g<h;++g){var k=c[g],f=Ef(b,f,k,d);if(0===g){if(e&&f||!e&&!f)return!1}else if(e&&!f||!e&&f)return!1;f=k}return!0}
function Gf(b,c,d,e,f){f=void 0!==f?f:!1;var g,h;g=0;for(h=d.length;g<h;++g){var k=d[g],m=Ef(b,c,k,e);if(0===g?f&&m||!f&&!m:f&&!m||!f&&m)for(var m=b,n=k,p=e;c<n-p;){var q;for(q=0;q<p;++q){var r=m[c+q];m[c+q]=m[n-p+q];m[n-p+q]=r}c+=p;n-=p}c=k}return c}function Hf(b,c,d,e){var f=0,g,h;g=0;for(h=c.length;g<h;++g)f=Gf(b,f,c[g],d,e);return f};function G(b,c){bf.call(this);this.g=[];this.C=-1;this.D=null;this.T=this.O=this.U=-1;this.l=null;this.ma(b,c)}z(G,bf);l=G.prototype;l.uj=function(b){this.A?jb(this.A,b.ja()):this.A=b.ja().slice();this.g.push(this.A.length);this.u()};l.clone=function(){var b=new G(null);b.ba(this.b,this.A.slice(),this.g.slice());return b};
l.pb=function(b,c,d,e){if(e<Rd(this.J(),b,c))return e;this.O!=this.f&&(this.U=Math.sqrt(kf(this.A,0,this.g,this.a,0)),this.O=this.f);return mf(this.A,0,this.g,this.a,this.U,!0,b,c,d,e)};l.yc=function(b,c){return zf(this.Rb(),0,this.g,this.a,b,c)};l.mm=function(){return gf(this.Rb(),0,this.g,this.a)};l.Z=function(b){var c;void 0!==b?(c=this.Rb().slice(),Gf(c,0,this.g,this.a,b)):c=this.A;return rf(c,0,this.g,this.a)};l.Bb=function(){return this.g};
function If(b){if(b.C!=b.f){var c=ke(b.J());b.D=Af(b.Rb(),0,b.g,b.a,c,0);b.C=b.f}return b.D}l.Yj=function(){return new F(If(this))};l.ck=function(){return this.g.length};l.Hg=function(b){if(0>b||this.g.length<=b)return null;var c=new vf(null);wf(c,this.b,this.A.slice(0===b?0:this.g[b-1],this.g[b]));return c};l.de=function(){var b=this.b,c=this.A,d=this.g,e=[],f=0,g,h;g=0;for(h=d.length;g<h;++g){var k=d[g],m=new vf(null);wf(m,b,c.slice(f,k));e.push(m);f=k}return e};
l.Rb=function(){if(this.T!=this.f){var b=this.A;Ff(b,this.g,this.a)?this.l=b:(this.l=b.slice(),this.l.length=Gf(this.l,0,this.g,this.a));this.T=this.f}return this.l};l.Nc=function(b){var c=[],d=[];c.length=tf(this.A,0,this.g,this.a,Math.sqrt(b),c,0,d);b=new G(null);b.ba("XY",c,d);return b};l.V=function(){return"Polygon"};l.Fa=function(b){return Df(this.Rb(),0,this.g,this.a,b)};
l.ma=function(b,c){if(b){ef(this,c,b,2);this.A||(this.A=[]);var d=pf(this.A,0,b,this.a,this.g);this.A.length=0===d.length?0:d[d.length-1];this.u()}else this.ba("XY",null,this.g)};l.ba=function(b,c,d){df(this,b,c);this.g=d;this.u()};function Jf(b,c,d,e){var f=e?e:32;e=[];var g;for(g=0;g<f;++g)jb(e,b.offset(c,d,2*Math.PI*g/f));e.push(e[0],e[1]);b=new G(null);b.ba("XY",e,[e.length]);return b}
function Kf(b){var c=b[0],d=b[1],e=b[2];b=b[3];c=[c,d,c,b,e,b,e,d,c,d];d=new G(null);d.ba("XY",c,[c.length]);return d}function Lf(b,c,d){var e=c?c:32,f=b.sa();c=b.b;for(var g=new G(null,c),e=f*(e+1),f=[],h=0;h<e;h++)f[h]=0;g.ba(c,f,[f.length]);Mf(g,b.yd(),b.Df(),d);return g}function Mf(b,c,d,e){var f=b.ja(),g=b.b,h=b.sa(),k=b.Bb(),m=f.length/h-1;e=e?e:0;for(var n,p,q=0;q<=m;++q)p=q*h,n=e+2*md(q,m)*Math.PI/m,f[p]=c[0]+d*Math.cos(n),f[p+1]=c[1]+d*Math.sin(n);b.ba(g,f,k)};function Nf(b){fd.call(this);b=b||{};this.b=[0,0];var c={};c.center=void 0!==b.center?b.center:null;this.g=Te(b.projection);var d,e,f,g=void 0!==b.minZoom?b.minZoom:0;d=void 0!==b.maxZoom?b.maxZoom:28;var h=void 0!==b.zoomFactor?b.zoomFactor:2;if(void 0!==b.resolutions)d=b.resolutions,e=d[0],f=d[d.length-1],d=wb(d);else{e=Te(b.projection);f=e.J();var k=(f?Math.max(ie(f),je(f)):360*Ae.degrees/e.$b())/256/Math.pow(2,0),m=k/Math.pow(2,28);e=b.maxResolution;void 0!==e?g=0:e=k/Math.pow(h,g);f=b.minResolution;
void 0===f&&(f=void 0!==b.maxZoom?void 0!==b.maxResolution?e/Math.pow(h,d):k/Math.pow(h,d):m);d=g+Math.floor(Math.log(e/f)/Math.log(h));f=e/Math.pow(h,d-g);d=xb(h,e,d-g)}this.a=e;this.j=f;this.c=g;g=void 0!==b.extent?Xa(b.extent):Ya;(void 0!==b.enableRotation?b.enableRotation:1)?(e=b.constrainRotation,e=void 0===e||!0===e?Bb():!1===e?zb:ma(e)?Ab(e):zb):e=yb;this.i=new Cb(g,d,e);void 0!==b.resolution?c.resolution=b.resolution:void 0!==b.zoom&&(c.resolution=this.constrainResolution(this.a,b.zoom-this.c));
c.rotation=void 0!==b.rotation?b.rotation:0;this.I(c)}z(Nf,fd);l=Nf.prototype;l.Yd=function(b){return this.i.center(b)};l.constrainResolution=function(b,c,d){return this.i.resolution(b,c||0,d||0)};l.constrainRotation=function(b,c){return this.i.rotation(b,c||0)};l.Va=function(){return this.get("center")};l.bd=function(b){var c=this.Va(),d=this.$(),e=this.Ha();return le(c,d,e,b)};l.Ul=function(){return this.g};l.$=function(){return this.get("resolution")};
function Of(b){var c=b.a,d=Math.log(c/b.j)/Math.log(2);return function(b){return c/Math.pow(2,b*d)}}l.Ha=function(){return this.get("rotation")};function Pf(b){var c=b.a,d=Math.log(c/b.j)/Math.log(2);return function(b){return Math.log(c/b)/Math.log(2)/d}}function Qf(b){var c=b.Va(),d=b.g,e=b.$();b=b.Ha();return{center:[Math.round(c[0]/e)*e,Math.round(c[1]/e)*e],projection:void 0!==d?d:null,resolution:e,rotation:b}}
l.Ak=function(){var b,c=this.$();if(void 0!==c){var d,e=0;do{d=this.constrainResolution(this.a,e);if(d==c){b=e;break}++e}while(d>this.j)}return void 0!==b?this.c+b:b};
l.mf=function(b,c,d){b instanceof bf||(b=Kf(b));var e=d||{};d=void 0!==e.padding?e.padding:[0,0,0,0];var f=void 0!==e.constrainResolution?e.constrainResolution:!0,g=void 0!==e.nearest?e.nearest:!1,h;void 0!==e.minResolution?h=e.minResolution:void 0!==e.maxZoom?h=this.constrainResolution(this.a,e.maxZoom-this.c,0):h=0;var k=b.ja(),m=this.Ha(),e=Math.cos(-m),m=Math.sin(-m),n=Infinity,p=Infinity,q=-Infinity,r=-Infinity;b=b.sa();for(var t=0,v=k.length;t<v;t+=b)var x=k[t]*e-k[t+1]*m,C=k[t]*m+k[t+1]*e,
n=Math.min(n,x),p=Math.min(p,C),q=Math.max(q,x),r=Math.max(r,C);k=[n,p,q,r];c=[c[0]-d[1]-d[3],c[1]-d[0]-d[2]];c=Math.max(ie(k)/c[0],je(k)/c[1]);c=isNaN(c)?h:Math.max(c,h);f&&(h=this.constrainResolution(c,0,0),!g&&h<c&&(h=this.constrainResolution(h,-1,0)),c=h);this.Vb(c);m=-m;g=(n+q)/2+(d[1]-d[3])/2*c;d=(p+r)/2+(d[0]-d[2])/2*c;this.mb([g*e-d*m,d*e+g*m])};
l.Aj=function(b,c,d){var e=this.Ha(),f=Math.cos(-e),e=Math.sin(-e),g=b[0]*f-b[1]*e;b=b[1]*f+b[0]*e;var h=this.$(),g=g+(c[0]/2-d[0])*h;b+=(d[1]-c[1]/2)*h;e=-e;this.mb([g*f-b*e,b*f+g*e])};function Rf(b){return!!b.Va()&&void 0!==b.$()}l.rotate=function(b,c){if(void 0!==c){var d,e=this.Va();void 0!==e&&(d=[e[0]-c[0],e[1]-c[1]],td(d,b-this.Ha()),od(d,c));this.mb(d)}this.we(b)};l.mb=function(b){this.set("center",b)};function Sf(b,c){b.b[1]+=c}l.Vb=function(b){this.set("resolution",b)};
l.we=function(b){this.set("rotation",b)};l.ep=function(b){b=this.constrainResolution(this.a,b-this.c,0);this.Vb(b)};function Tf(b){return Math.pow(b,3)}function Uf(b){return 1-Tf(1-b)}function Vf(b){return 3*b*b-2*b*b*b}function Wf(b){return b}function Xf(b){return.5>b?Vf(2*b):1-Vf(2*(b-.5))};function Yf(b){var c=b.source,d=b.start?b.start:Date.now(),e=c[0],f=c[1],g=void 0!==b.duration?b.duration:1E3,h=b.easing?b.easing:Vf;return function(b,c){if(c.time<d)return c.animate=!0,c.viewHints[0]+=1,!0;if(c.time<d+g){var n=1-h((c.time-d)/g),p=e-c.viewState.center[0],q=f-c.viewState.center[1];c.animate=!0;c.viewState.center[0]+=n*p;c.viewState.center[1]+=n*q;c.viewHints[0]+=1;return!0}return!1}}
function Zf(b){var c=b.rotation?b.rotation:0,d=b.start?b.start:Date.now(),e=void 0!==b.duration?b.duration:1E3,f=b.easing?b.easing:Vf,g=b.anchor?b.anchor:null;return function(b,k){if(k.time<d)return k.animate=!0,k.viewHints[0]+=1,!0;if(k.time<d+e){var m=1-f((k.time-d)/e),m=(c-k.viewState.rotation)*m;k.animate=!0;k.viewState.rotation+=m;if(g){var n=k.viewState.center;n[0]-=g[0];n[1]-=g[1];td(n,m);od(n,g)}k.viewHints[0]+=1;return!0}return!1}}
function $f(b){var c=b.resolution,d=b.start?b.start:Date.now(),e=void 0!==b.duration?b.duration:1E3,f=b.easing?b.easing:Vf;return function(b,h){if(h.time<d)return h.animate=!0,h.viewHints[0]+=1,!0;if(h.time<d+e){var k=1-f((h.time-d)/e),m=c-h.viewState.resolution;h.animate=!0;h.viewState.resolution+=k*m;h.viewHints[0]+=1;return!0}return!1}};function ag(b,c,d,e){return void 0!==e?(e[0]=b,e[1]=c,e[2]=d,e):[b,c,d]}function bg(b){var c=b[0],d=Array(c),e=1<<c-1,f,g;for(f=0;f<c;++f)g=48,b[1]&e&&(g+=1),b[2]&e&&(g+=2),d[f]=String.fromCharCode(g),e>>=1;return d.join("")};function cg(b,c,d,e){this.a=b;this.c=c;this.f=d;this.b=e}cg.prototype.contains=function(b){return eg(this,b[1],b[2])};function fg(b,c){return b.a<=c.a&&c.c<=b.c&&b.f<=c.f&&c.b<=b.b}function eg(b,c,d){return b.a<=c&&c<=b.c&&b.f<=d&&d<=b.b}function gg(b,c){return b.a==c.a&&b.f==c.f&&b.c==c.c&&b.b==c.b}function hg(b){return b.b-b.f+1}function ig(b){return b.c-b.a+1}function jg(b,c){return b.a<=c.c&&b.c>=c.a&&b.f<=c.b&&b.b>=c.f};function kg(b){this.f=b.html;this.a=b.tileRanges?b.tileRanges:null}kg.prototype.b=function(){return this.f};function lg(b,c,d){rc.call(this,b,d);this.element=c}z(lg,rc);function mg(b){fd.call(this);this.a=b?b:[];ng(this)}z(mg,fd);l=mg.prototype;l.clear=function(){for(;0<this.bc();)this.pop()};l.zf=function(b){var c,d;c=0;for(d=b.length;c<d;++c)this.push(b[c]);return this};l.forEach=function(b,c){this.a.forEach(b,c)};l.El=function(){return this.a};l.item=function(b){return this.a[b]};l.bc=function(){return this.get("length")};l.ne=function(b,c){kb(this.a,b,0,c);ng(this);this.s(new lg("add",c,this))};
l.pop=function(){return this.Wf(this.bc()-1)};l.push=function(b){var c=this.a.length;this.ne(c,b);return c};l.remove=function(b){var c=this.a,d,e;d=0;for(e=c.length;d<e;++d)if(c[d]===b)return this.Wf(d)};l.Wf=function(b){var c=this.a[b];Za.splice.call(this.a,b,1);ng(this);this.s(new lg("remove",c,this));return c};l.Ro=function(b,c){var d=this.bc();if(b<d)d=this.a[b],this.a[b]=c,this.s(new lg("remove",d,this)),this.s(new lg("add",c,this));else{for(;d<b;++d)this.ne(d,void 0);this.ne(b,c)}};
function ng(b){b.set("length",b.a.length)};var og=/^#(?:[0-9a-f]{3}){1,2}$/i,pg=/^(?:rgb)?\((0|[1-9]\d{0,2}),\s?(0|[1-9]\d{0,2}),\s?(0|[1-9]\d{0,2})\)$/i,qg=/^(?:rgba)?\((0|[1-9]\d{0,2}),\s?(0|[1-9]\d{0,2}),\s?(0|[1-9]\d{0,2}),\s?(0|1|0\.\d{0,10})\)$/i;function rg(b){return ia(b)?b:sg(b)}function tg(b){if(!la(b)){var c=b[0];c!=(c|0)&&(c=c+.5|0);var d=b[1];d!=(d|0)&&(d=d+.5|0);var e=b[2];e!=(e|0)&&(e=e+.5|0);b="rgba("+c+","+d+","+e+","+b[3]+")"}return b}
var sg=function(){var b={},c=0;return function(d){var e;if(b.hasOwnProperty(d))e=b[d];else{if(1024<=c){e=0;for(var f in b)0===(e++&3)&&(delete b[f],--c)}var g,h;og.exec(d)?(h=3==d.length-1?1:2,e=parseInt(d.substr(1+0*h,h),16),f=parseInt(d.substr(1+1*h,h),16),g=parseInt(d.substr(1+2*h,h),16),1==h&&(e=(e<<4)+e,f=(f<<4)+f,g=(g<<4)+g),e=[e,f,g,1]):(h=qg.exec(d))?(e=Number(h[1]),f=Number(h[2]),g=Number(h[3]),h=Number(h[4]),e=[e,f,g,h],e=ug(e,e)):(h=pg.exec(d))?(e=Number(h[1]),f=Number(h[2]),g=Number(h[3]),
e=[e,f,g,1],e=ug(e,e)):e=void 0;b[d]=e;++c}return e}}();function ug(b,c){var d=c||[];d[0]=Ra(b[0]+.5|0,0,255);d[1]=Ra(b[1]+.5|0,0,255);d[2]=Ra(b[2]+.5|0,0,255);d[3]=Ra(b[3],0,1);return d};var vg=!Wb||9<=ic;!Yb&&!Wb||Wb&&9<=ic||Yb&&gc("1.9.1");Wb&&gc("9");function wg(b,c){this.x=ca(b)?b:0;this.y=ca(c)?c:0}l=wg.prototype;l.clone=function(){return new wg(this.x,this.y)};l.ceil=function(){this.x=Math.ceil(this.x);this.y=Math.ceil(this.y);return this};l.floor=function(){this.x=Math.floor(this.x);this.y=Math.floor(this.y);return this};l.round=function(){this.x=Math.round(this.x);this.y=Math.round(this.y);return this};l.scale=function(b,c){var d=ma(c)?c:b;this.x*=b;this.y*=d;return this};function xg(b,c){this.width=b;this.height=c}l=xg.prototype;l.clone=function(){return new xg(this.width,this.height)};l.xj=function(){return this.width*this.height};l.Na=function(){return!this.xj()};l.ceil=function(){this.width=Math.ceil(this.width);this.height=Math.ceil(this.height);return this};l.floor=function(){this.width=Math.floor(this.width);this.height=Math.floor(this.height);return this};l.round=function(){this.width=Math.round(this.width);this.height=Math.round(this.height);return this};
l.scale=function(b,c){var d=ma(c)?c:b;this.width*=b;this.height*=d;return this};function yg(b){return b?new zg(Ag(b)):Aa||(Aa=new zg)}function Bg(b){var c=document;return la(b)?c.getElementById(b):b}function Cg(b,c){Hb(c,function(c,e){"style"==e?b.style.cssText=c:"class"==e?b.className=c:"for"==e?b.htmlFor=c:Dg.hasOwnProperty(e)?b.setAttribute(Dg[e],c):0==e.lastIndexOf("aria-",0)||0==e.lastIndexOf("data-",0)?b.setAttribute(e,c):b[e]=c})}
var Dg={cellpadding:"cellPadding",cellspacing:"cellSpacing",colspan:"colSpan",frameborder:"frameBorder",height:"height",maxlength:"maxLength",role:"role",rowspan:"rowSpan",type:"type",usemap:"useMap",valign:"vAlign",width:"width"};function Eg(b){b=b.document.documentElement;return new xg(b.clientWidth,b.clientHeight)}
function Fg(b,c,d){var e=arguments,f=document,g=e[0],h=e[1];if(!vg&&h&&(h.name||h.type)){g=["<",g];h.name&&g.push(' name="',Ea(h.name),'"');if(h.type){g.push(' type="',Ea(h.type),'"');var k={};Ub(k,h);delete k.type;h=k}g.push(">");g=g.join("")}g=f.createElement(g);h&&(la(h)?g.className=h:ia(h)?g.className=h.join(" "):Cg(g,h));2<e.length&&Gg(f,g,e);return g}
function Gg(b,c,d){function e(d){d&&c.appendChild(la(d)?b.createTextNode(d):d)}for(var f=2;f<d.length;f++){var g=d[f];!ka(g)||oa(g)&&0<g.nodeType?e(g):ab(Hg(g)?ib(g):g,e)}}function Ig(b){for(var c;c=b.firstChild;)b.removeChild(c)}function Jg(b,c,d){b.insertBefore(c,b.childNodes[d]||null)}function Kg(b){b&&b.parentNode&&b.parentNode.removeChild(b)}function Lg(b,c){var d=c.parentNode;d&&d.replaceChild(b,c)}
function Mg(b){if(ca(b.firstElementChild))b=b.firstElementChild;else for(b=b.firstChild;b&&1!=b.nodeType;)b=b.nextSibling;return b}function Ng(b,c){if(b.contains&&1==c.nodeType)return b==c||b.contains(c);if("undefined"!=typeof b.compareDocumentPosition)return b==c||Boolean(b.compareDocumentPosition(c)&16);for(;c&&b!=c;)c=c.parentNode;return c==b}function Ag(b){return 9==b.nodeType?b:b.ownerDocument||b.document}
function Hg(b){if(b&&"number"==typeof b.length){if(oa(b))return"function"==typeof b.item||"string"==typeof b.item;if(na(b))return"function"==typeof b.item}return!1}function zg(b){this.a=b||ba.document||document}zg.prototype.I=Cg;function Og(){return!0}
function Pg(b){var c=b.a;b=c.scrollingElement?c.scrollingElement:Zb?c.body||c.documentElement:c.documentElement;c=c.parentWindow||c.defaultView;return Wb&&gc("10")&&c.pageYOffset!=b.scrollTop?new wg(b.scrollLeft,b.scrollTop):new wg(c.pageXOffset||b.scrollLeft,c.pageYOffset||b.scrollTop)}zg.prototype.appendChild=function(b,c){b.appendChild(c)};zg.prototype.contains=Ng;function Qg(b){if(b.classList)return b.classList;b=b.className;return la(b)&&b.match(/\S+/g)||[]}function Rg(b,c){var d;b.classList?d=b.classList.contains(c):(d=Qg(b),d=0<=$a(d,c));return d}function Sg(b,c){b.classList?b.classList.add(c):Rg(b,c)||(b.className+=0<b.className.length?" "+c:c)}function Tg(b,c){b.classList?b.classList.remove(c):Rg(b,c)&&(b.className=bb(Qg(b),function(b){return b!=c}).join(" "))}function Ug(b,c){Rg(b,c)?Tg(b,c):Sg(b,c)};function Vg(b,c,d,e){this.top=b;this.right=c;this.bottom=d;this.left=e}l=Vg.prototype;l.clone=function(){return new Vg(this.top,this.right,this.bottom,this.left)};l.contains=function(b){return this&&b?b instanceof Vg?b.left>=this.left&&b.right<=this.right&&b.top>=this.top&&b.bottom<=this.bottom:b.x>=this.left&&b.x<=this.right&&b.y>=this.top&&b.y<=this.bottom:!1};
l.ceil=function(){this.top=Math.ceil(this.top);this.right=Math.ceil(this.right);this.bottom=Math.ceil(this.bottom);this.left=Math.ceil(this.left);return this};l.floor=function(){this.top=Math.floor(this.top);this.right=Math.floor(this.right);this.bottom=Math.floor(this.bottom);this.left=Math.floor(this.left);return this};l.round=function(){this.top=Math.round(this.top);this.right=Math.round(this.right);this.bottom=Math.round(this.bottom);this.left=Math.round(this.left);return this};
l.scale=function(b,c){var d=ma(c)?c:b;this.left*=b;this.right*=b;this.top*=d;this.bottom*=d;return this};function Wg(b,c,d,e){this.left=b;this.top=c;this.width=d;this.height=e}l=Wg.prototype;l.clone=function(){return new Wg(this.left,this.top,this.width,this.height)};l.contains=function(b){return b instanceof Wg?this.left<=b.left&&this.left+this.width>=b.left+b.width&&this.top<=b.top&&this.top+this.height>=b.top+b.height:b.x>=this.left&&b.x<=this.left+this.width&&b.y>=this.top&&b.y<=this.top+this.height};
l.distance=function(b){var c=b.x<this.left?this.left-b.x:Math.max(b.x-(this.left+this.width),0);b=b.y<this.top?this.top-b.y:Math.max(b.y-(this.top+this.height),0);return Math.sqrt(c*c+b*b)};l.ceil=function(){this.left=Math.ceil(this.left);this.top=Math.ceil(this.top);this.width=Math.ceil(this.width);this.height=Math.ceil(this.height);return this};l.floor=function(){this.left=Math.floor(this.left);this.top=Math.floor(this.top);this.width=Math.floor(this.width);this.height=Math.floor(this.height);return this};
l.round=function(){this.left=Math.round(this.left);this.top=Math.round(this.top);this.width=Math.round(this.width);this.height=Math.round(this.height);return this};l.scale=function(b,c){var d=ma(c)?c:b;this.left*=b;this.width*=b;this.top*=d;this.height*=d;return this};function Xg(b,c){var d=Ag(b);return d.defaultView&&d.defaultView.getComputedStyle&&(d=d.defaultView.getComputedStyle(b,null))?d[c]||d.getPropertyValue(c)||"":""}function Yg(b,c){return Xg(b,c)||(b.currentStyle?b.currentStyle[c]:null)||b.style&&b.style[c]}function Zg(b,c,d){var e;c instanceof wg?(e=c.x,c=c.y):(e=c,c=d);b.style.left=$g(e);b.style.top=$g(c)}
function ah(b){var c;try{c=b.getBoundingClientRect()}catch(d){return{left:0,top:0,right:0,bottom:0}}Wb&&b.ownerDocument.body&&(b=b.ownerDocument,c.left-=b.documentElement.clientLeft+b.body.clientLeft,c.top-=b.documentElement.clientTop+b.body.clientTop);return c}function bh(b){if(1==b.nodeType)return b=ah(b),new wg(b.left,b.top);b=b.changedTouches?b.changedTouches[0]:b;return new wg(b.clientX,b.clientY)}function $g(b){"number"==typeof b&&(b=b+"px");return b}
function ch(b){var c=dh;if("none"!=Yg(b,"display"))return c(b);var d=b.style,e=d.display,f=d.visibility,g=d.position;d.visibility="hidden";d.position="absolute";d.display="inline";b=c(b);d.display=e;d.position=g;d.visibility=f;return b}function dh(b){var c=b.offsetWidth,d=b.offsetHeight,e=Zb&&!c&&!d;return ca(c)&&!e||!b.getBoundingClientRect?new xg(c,d):(b=ah(b),new xg(b.right-b.left,b.bottom-b.top))}function eh(b,c){b.style.display=c?"":"none"}
function fh(b,c,d,e){if(/^\d+px?$/.test(c))return parseInt(c,10);var f=b.style[d],g=b.runtimeStyle[d];b.runtimeStyle[d]=b.currentStyle[d];b.style[d]=c;c=b.style[e];b.style[d]=f;b.runtimeStyle[d]=g;return c}function gh(b,c){var d=b.currentStyle?b.currentStyle[c]:null;return d?fh(b,d,"left","pixelLeft"):0}
function hh(b,c){if(Wb){var d=gh(b,c+"Left"),e=gh(b,c+"Right"),f=gh(b,c+"Top"),g=gh(b,c+"Bottom");return new Vg(f,e,g,d)}d=Xg(b,c+"Left");e=Xg(b,c+"Right");f=Xg(b,c+"Top");g=Xg(b,c+"Bottom");return new Vg(parseFloat(f),parseFloat(e),parseFloat(g),parseFloat(d))}var ih={thin:2,medium:4,thick:6};function jh(b,c){if("none"==(b.currentStyle?b.currentStyle[c+"Style"]:null))return 0;var d=b.currentStyle?b.currentStyle[c+"Width"]:null;return d in ih?ih[d]:fh(b,d,"left","pixelLeft")}
function kh(b){if(Wb&&!(9<=ic)){var c=jh(b,"borderLeft"),d=jh(b,"borderRight"),e=jh(b,"borderTop");b=jh(b,"borderBottom");return new Vg(e,d,b,c)}c=Xg(b,"borderLeftWidth");d=Xg(b,"borderRightWidth");e=Xg(b,"borderTopWidth");b=Xg(b,"borderBottomWidth");return new Vg(parseFloat(e),parseFloat(d),parseFloat(b),parseFloat(c))};function lh(b,c,d){rc.call(this,b);this.map=c;this.frameState=void 0!==d?d:null}z(lh,rc);function mh(b){fd.call(this);this.element=b.element?b.element:null;this.a=this.U=null;this.o=[];this.render=b.render?b.render:ya;b.target&&this.c(b.target)}z(mh,fd);mh.prototype.X=function(){Kg(this.element);mh.da.X.call(this)};mh.prototype.g=function(){return this.a};
mh.prototype.setMap=function(b){this.a&&Kg(this.element);0<this.o.length&&(this.o.forEach(Wc),this.o.length=0);if(this.a=b)(this.U?this.U:b.j).appendChild(this.element),this.render!==ya&&this.o.push(D(b,"postrender",this.render,!1,this)),b.render()};mh.prototype.c=function(b){this.U=Bg(b)};function nh(){this.b=0;this.c={};this.f=this.a=null}l=nh.prototype;l.clear=function(){this.b=0;this.c={};this.f=this.a=null};function oh(b,c){return b.c.hasOwnProperty(c)}l.forEach=function(b,c){for(var d=this.a;d;)b.call(c,d.nc,d.qe,this),d=d.ub};l.get=function(b){b=this.c[b];if(b===this.f)return b.nc;b===this.a?(this.a=this.a.ub,this.a.ic=null):(b.ub.ic=b.ic,b.ic.ub=b.ub);b.ub=null;b.ic=this.f;this.f=this.f.ub=b;return b.nc};l.sc=function(){return this.b};
l.P=function(){var b=Array(this.b),c=0,d;for(d=this.f;d;d=d.ic)b[c++]=d.qe;return b};l.wc=function(){var b=Array(this.b),c=0,d;for(d=this.f;d;d=d.ic)b[c++]=d.nc;return b};l.pop=function(){var b=this.a;delete this.c[b.qe];b.ub&&(b.ub.ic=null);this.a=b.ub;this.a||(this.f=null);--this.b;return b.nc};l.replace=function(b,c){this.get(b);this.c[b].nc=c};l.set=function(b,c){var d={qe:b,ub:null,ic:this.f,nc:c};this.f?this.f.ub=d:this.a=d;this.f=d;this.c[b]=d;++this.b};function ph(b){nh.call(this);this.g=void 0!==b?b:2048}z(ph,nh);function qh(b){return b.sc()>b.g}function rh(b,c){for(var d,e;qh(b)&&!(d=b.a.nc,e=d.ga[0].toString(),e in c&&c[e].contains(d.ga));)b.pop().rc()};function sh(b,c){$c.call(this);this.ga=b;this.state=c;this.a=null;this.key=""}z(sh,$c);function th(b){b.s("change")}sh.prototype.bb=function(){return w(this).toString()};sh.prototype.c=function(){return this.ga};function uh(b){fd.call(this);this.b=Ee(b.projection);this.i=void 0!==b.attributions?b.attributions:null;this.U=b.logo;this.B=void 0!==b.state?b.state:"ready";this.O=void 0!==b.wrapX?b.wrapX:!1}z(uh,fd);l=uh.prototype;l.Ae=ya;l.ta=function(){return this.i};l.ra=function(){return this.U};l.ua=function(){return this.b};l.va=function(){return this.B};function vh(b){return b.O}l.oa=function(b){this.i=b;this.u()};function wh(b,c){b.B=c;b.u()};function xh(b){this.minZoom=void 0!==b.minZoom?b.minZoom:0;this.a=b.resolutions;this.maxZoom=this.a.length-1;this.b=void 0!==b.origin?b.origin:null;this.g=null;void 0!==b.origins&&(this.g=b.origins);var c=b.extent;void 0===c||this.b||this.g||(this.b=fe(c));this.i=null;void 0!==b.tileSizes&&(this.i=b.tileSizes);this.l=void 0!==b.tileSize?b.tileSize:this.i?null:256;this.G=void 0!==c?c:null;this.f=null;void 0!==b.sizes?this.f=b.sizes.map(function(b){return new cg(Math.min(0,b[0]),Math.max(b[0]-1,-1),
Math.min(0,b[1]),Math.max(b[1]-1,-1))},this):c&&yh(this,c);this.c=[0,0]}var zh=[0,0,0];function Ah(b,c,d,e,f){f=b.Ba(c,f);for(c=c[0]-1;c>=b.minZoom;){if(d.call(null,c,Bh(b,f,c,e)))return!0;--c}return!1}l=xh.prototype;l.J=function(){return this.G};l.Ig=function(){return this.maxZoom};l.Jg=function(){return this.minZoom};l.Ea=function(b){return this.b?this.b:this.g[b]};l.$=function(b){return this.a[b]};l.Fh=function(){return this.a};
function Ch(b,c,d,e){return c[0]<b.maxZoom?(e=b.Ba(c,e),Bh(b,e,c[0]+1,d)):null}function Dh(b,c,d,e){Eh(b,c[0],c[1],d,!1,zh);var f=zh[1],g=zh[2];Eh(b,c[2],c[3],d,!0,zh);b=zh[1];c=zh[2];void 0!==e?(e.a=f,e.c=b,e.f=g,e.b=c):e=new cg(f,b,g,c);return e}function Bh(b,c,d,e){d=b.$(d);return Dh(b,c,d,e)}function Fh(b,c){var d=b.Ea(c[0]),e=b.$(c[0]),f=ld(b.Ma(c[0]),b.c);return[d[0]+(c[1]+.5)*f[0]*e,d[1]+(c[2]+.5)*f[1]*e]}
l.Ba=function(b,c){var d=this.Ea(b[0]),e=this.$(b[0]),f=ld(this.Ma(b[0]),this.c),g=d[0]+b[1]*f[0]*e,d=d[1]+b[2]*f[1]*e;return Od(g,d,g+f[0]*e,d+f[1]*e,c)};l.he=function(b,c,d){return Eh(this,b[0],b[1],c,!1,d)};function Eh(b,c,d,e,f,g){var h=Gh(b,e),k=e/b.$(h),m=b.Ea(h);b=ld(b.Ma(h),b.c);c=k*Math.floor((c-m[0])/e+(f?.5:0))/b[0];d=k*Math.floor((d-m[1])/e+(f?0:.5))/b[1];f?(c=Math.ceil(c)-1,d=Math.ceil(d)-1):(c=Math.floor(c),d=Math.floor(d));return ag(h,c,d,g)}
l.ie=function(b,c,d){c=this.$(c);return Eh(this,b[0],b[1],c,!1,d)};l.Ma=function(b){return this.l?this.l:this.i[b]};function Gh(b,c){var d=vb(b.a,c,0);return Ra(d,b.minZoom,b.maxZoom)}function yh(b,c){for(var d=b.a.length,e=Array(d),f=b.minZoom;f<d;++f)e[f]=Bh(b,c,f);b.f=e}function Hh(b){var c=b.j;if(!c){var c=Ih(b),d=Jh(c,void 0,void 0),c=new xh({extent:c,origin:fe(c),resolutions:d,tileSize:void 0});b.j=c}return c}
function Kh(b){var c={};Ub(c,void 0!==b?b:{});void 0===c.extent&&(c.extent=Ee("EPSG:3857").J());c.resolutions=Jh(c.extent,c.maxZoom,c.tileSize);delete c.maxZoom;return new xh(c)}function Jh(b,c,d){c=void 0!==c?c:42;var e=je(b);b=ie(b);d=ld(void 0!==d?d:256);d=Math.max(b/d[0],e/d[1]);c+=1;e=Array(c);for(b=0;b<c;++b)e[b]=d/Math.pow(2,b);return e}function Ih(b){b=Ee(b);var c=b.J();c||(b=180*Ae.degrees/b.$b(),c=Od(-b,-b,b,b));return c};function Lh(b){uh.call(this,{attributions:b.attributions,extent:b.extent,logo:b.logo,projection:b.projection,state:b.state,wrapX:b.wrapX});this.qa=void 0!==b.opaque?b.opaque:!1;this.xa=void 0!==b.tilePixelRatio?b.tilePixelRatio:1;this.tileGrid=void 0!==b.tileGrid?b.tileGrid:null;this.a=new ph(b.ff);this.g=[0,0]}z(Lh,uh);l=Lh.prototype;l.wh=function(){return qh(this.a)};l.xh=function(b,c){var d=this.wd(b);d&&rh(d,c)};
function Mh(b,c,d,e,f){c=b.wd(c);if(!c)return!1;for(var g=!0,h,k,m=e.a;m<=e.c;++m)for(var n=e.f;n<=e.b;++n)h=b.Cb(d,m,n),k=!1,oh(c,h)&&(h=c.get(h),(k=2===h.state)&&(k=!1!==f(h))),k||(g=!1);return g}l.ce=function(){return 0};l.rf=function(){return""};l.Cb=function(b,c,d){return b+"/"+c+"/"+d};l.tf=function(){return this.qa};l.Ja=function(){return this.tileGrid};l.kb=function(b){return this.tileGrid?this.tileGrid:Hh(b)};l.wd=function(b){var c=this.b;return c&&!Ve(c,b)?null:this.a};l.vc=function(){return this.xa};
function Nh(b,c,d,e){e=b.kb(e);d=b.vc(d);c=ld(e.Ma(c),b.g);return 1==d?c:kd(c,d,b.g)}function Oh(b,c,d){var e=void 0!==d?d:b.b;d=b.kb(e);if(b.O&&e.b){var f=c;c=f[0];b=Fh(d,f);e=Ih(e);Sd(e,b)?c=f:(f=ie(e),b[0]+=f*Math.ceil((e[0]-b[0])/f),c=d.ie(b,c))}f=c[0];e=c[1];b=c[2];if(d.minZoom>f||f>d.maxZoom)d=!1;else{var g=d.J();d=(d=g?Bh(d,g,f):d.f?d.f[f]:null)?eg(d,e,b):!0}return d?c:null}l.bg=ya;function Ph(b,c){rc.call(this,b);this.tile=c}z(Ph,rc);function Qh(b){b=b?b:{};this.C=document.createElement("UL");this.B=document.createElement("LI");this.C.appendChild(this.B);eh(this.B,!1);this.b=void 0!==b.collapsed?b.collapsed:!0;this.j=void 0!==b.collapsible?b.collapsible:!0;this.j||(this.b=!1);var c=b.className?b.className:"ol-attribution",d=b.tipLabel?b.tipLabel:"Attributions",e=b.collapseLabel?b.collapseLabel:"\u00bb";this.D=la(e)?Fg("SPAN",{},e):e;e=b.label?b.label:"i";this.O=la(e)?Fg("SPAN",{},e):e;d=Fg("BUTTON",{type:"button",title:d},this.j&&
!this.b?this.D:this.O);D(d,"click",this.Xl,!1,this);c=Fg("DIV",c+" ol-unselectable ol-control"+(this.b&&this.j?" ol-collapsed":"")+(this.j?"":" ol-uncollapsible"),this.C,d);mh.call(this,{element:c,render:b.render?b.render:Rh,target:b.target});this.v=!0;this.l={};this.i={};this.T={}}z(Qh,mh);
function Rh(b){if(b=b.frameState){var c,d,e,f,g,h,k,m,n,p,q,r=b.layerStatesArray,t=Rb(b.attributions),v={},x=b.viewState.projection;d=0;for(c=r.length;d<c;d++)if(h=r[d].layer.ea())if(p=w(h).toString(),n=h.i)for(e=0,f=n.length;e<f;e++)if(k=n[e],m=w(k).toString(),!(m in t)){if(g=b.usedTiles[p]){var C=h.kb(x);a:{q=k;var A=x;if(q.a){var y=void 0,B=void 0,M=void 0,K=void 0;for(K in g)if(K in q.a)for(var M=g[K],E,y=0,B=q.a[K].length;y<B;++y){E=q.a[K][y];if(jg(E,M)){q=!0;break a}var P=Bh(C,Ih(A),parseInt(K,
10)),fa=ig(P);if(M.a<P.a||M.c>P.c)if(jg(E,new cg(md(M.a,fa),md(M.c,fa),M.f,M.b))||ig(M)>fa&&jg(E,P)){q=!0;break a}}q=!1}else q=!0}}else q=!1;q?(m in v&&delete v[m],t[m]=k):v[m]=k}c=[t,v];d=c[0];c=c[1];for(var I in this.l)I in d?(this.i[I]||(eh(this.l[I],!0),this.i[I]=!0),delete d[I]):I in c?(this.i[I]&&(eh(this.l[I],!1),delete this.i[I]),delete c[I]):(Kg(this.l[I]),delete this.l[I],delete this.i[I]);for(I in d)e=document.createElement("LI"),e.innerHTML=d[I].f,this.C.appendChild(e),this.l[I]=e,this.i[I]=
!0;for(I in c)e=document.createElement("LI"),e.innerHTML=c[I].f,eh(e,!1),this.C.appendChild(e),this.l[I]=e;I=!Nb(this.i)||!Nb(b.logos);this.v!=I&&(eh(this.element,I),this.v=I);I&&Nb(this.i)?Sg(this.element,"ol-logo-only"):Tg(this.element,"ol-logo-only");var ga;b=b.logos;I=this.T;for(ga in I)ga in b||(Kg(I[ga]),delete I[ga]);for(var Ja in b)Ja in I||(ga=new Image,ga.src=Ja,d=b[Ja],""===d?d=ga:(d=Fg("A",{href:d}),d.appendChild(ga)),this.B.appendChild(d),I[Ja]=d);eh(this.B,!Nb(b))}else this.v&&(eh(this.element,
!1),this.v=!1)}l=Qh.prototype;l.Xl=function(b){b.preventDefault();Sh(this)};function Sh(b){Ug(b.element,"ol-collapsed");b.b?Lg(b.D,b.O):Lg(b.O,b.D);b.b=!b.b}l.Wl=function(){return this.j};l.Zl=function(b){this.j!==b&&(this.j=b,Ug(this.element,"ol-uncollapsible"),!b&&this.b&&Sh(this))};l.Yl=function(b){this.j&&this.b!==b&&Sh(this)};l.Vl=function(){return this.b};function Th(b){b=b?b:{};var c=b.className?b.className:"ol-rotate",d=b.label?b.label:"\u21e7";this.b=null;la(d)?this.b=Fg("SPAN","ol-compass",d):(this.b=d,Sg(this.b,"ol-compass"));d=Fg("BUTTON",{"class":c+"-reset",type:"button",title:b.tipLabel?b.tipLabel:"Reset rotation"},this.b);D(d,"click",Th.prototype.v,!1,this);c=Fg("DIV",c+" ol-unselectable ol-control",d);d=b.render?b.render:Uh;this.j=b.resetNorth?b.resetNorth:void 0;mh.call(this,{element:c,render:d,target:b.target});this.l=void 0!==b.duration?
b.duration:250;this.i=void 0!==b.autoHide?b.autoHide:!0;this.B=void 0;this.i&&Sg(this.element,"ol-hidden")}z(Th,mh);Th.prototype.v=function(b){b.preventDefault();if(void 0!==this.j)this.j();else{b=this.a;var c=b.aa();if(c){var d=c.Ha();void 0!==d&&(0<this.l&&(d%=2*Math.PI,d<-Math.PI&&(d+=2*Math.PI),d>Math.PI&&(d-=2*Math.PI),b.Pa(Zf({rotation:d,duration:this.l,easing:Uf}))),c.we(0))}}};
function Uh(b){if(b=b.frameState){b=b.viewState.rotation;if(b!=this.B){var c="rotate("+b+"rad)";if(this.i){var d=this.element;0===b?Sg(d,"ol-hidden"):Tg(d,"ol-hidden")}this.b.style.msTransform=c;this.b.style.webkitTransform=c;this.b.style.transform=c}this.B=b}};function Vh(b){b=b?b:{};var c=b.className?b.className:"ol-zoom",d=b.delta?b.delta:1,e=b.zoomOutLabel?b.zoomOutLabel:"\u2212",f=b.zoomOutTipLabel?b.zoomOutTipLabel:"Zoom out",g=Fg("BUTTON",{"class":c+"-in",type:"button",title:b.zoomInTipLabel?b.zoomInTipLabel:"Zoom in"},b.zoomInLabel?b.zoomInLabel:"+");D(g,"click",ua(Vh.prototype.i,d),!1,this);e=Fg("BUTTON",{"class":c+"-out",type:"button",title:f},e);D(e,"click",ua(Vh.prototype.i,-d),!1,this);c=Fg("DIV",c+" ol-unselectable ol-control",g,e);mh.call(this,
{element:c,target:b.target});this.b=void 0!==b.duration?b.duration:250}z(Vh,mh);Vh.prototype.i=function(b,c){c.preventDefault();var d=this.a,e=d.aa();if(e){var f=e.$();f&&(0<this.b&&d.Pa($f({resolution:f,duration:this.b,easing:Uf})),d=e.constrainResolution(f,b),e.Vb(d))}};function Wh(b){b=b?b:{};var c=new mg;(void 0!==b.zoom?b.zoom:1)&&c.push(new Vh(b.zoomOptions));(void 0!==b.rotate?b.rotate:1)&&c.push(new Th(b.rotateOptions));(void 0!==b.attribution?b.attribution:1)&&c.push(new Qh(b.attributionOptions));return c};var Xh=Zb?"webkitfullscreenchange":Yb?"mozfullscreenchange":Wb?"MSFullscreenChange":"fullscreenchange";function Yh(){var b=yg().a,c=b.body;return!!(c.webkitRequestFullscreen||c.mozRequestFullScreen&&b.mozFullScreenEnabled||c.msRequestFullscreen&&b.msFullscreenEnabled||c.requestFullscreen&&b.fullscreenEnabled)}
function Zh(b){b.webkitRequestFullscreen?b.webkitRequestFullscreen():b.mozRequestFullScreen?b.mozRequestFullScreen():b.msRequestFullscreen?b.msRequestFullscreen():b.requestFullscreen&&b.requestFullscreen()}function $h(){var b=yg().a;return!!(b.webkitIsFullScreen||b.mozFullScreen||b.msFullscreenElement||b.fullscreenElement)};function bi(b){b=b?b:{};this.b=b.className?b.className:"ol-full-screen";var c=b.label?b.label:"\u2922";this.i=la(c)?document.createTextNode(c):c;c=b.labelActive?b.labelActive:"\u00d7";this.j=la(c)?document.createTextNode(c):c;c=b.tipLabel?b.tipLabel:"Toggle full-screen";c=Fg("BUTTON",{"class":this.b+"-"+$h(),type:"button",title:c},this.i);D(c,"click",this.v,!1,this);D(ba.document,Xh,this.l,!1,this);var d=this.b+" ol-unselectable ol-control "+(Yh()?"":"ol-unsupported"),c=Fg("DIV",d,c);mh.call(this,
{element:c,target:b.target});this.B=void 0!==b.keys?b.keys:!1}z(bi,mh);bi.prototype.v=function(b){b.preventDefault();Yh()&&(b=this.a)&&($h()?(b=yg().a,b.webkitCancelFullScreen?b.webkitCancelFullScreen():b.mozCancelFullScreen?b.mozCancelFullScreen():b.msExitFullscreen?b.msExitFullscreen():b.exitFullscreen&&b.exitFullscreen()):(b=b.uc(),this.B?b.mozRequestFullScreenWithKeys?b.mozRequestFullScreenWithKeys():b.webkitRequestFullscreen?b.webkitRequestFullscreen():Zh(b):Zh(b)))};
bi.prototype.l=function(){var b=this.b+"-true",c=this.b+"-false",d=Mg(this.element),e=this.a;$h()?(Rg(d,c)&&(Tg(d,c),Sg(d,b)),Lg(this.j,this.i)):(Rg(d,b)&&(Tg(d,b),Sg(d,c)),Lg(this.i,this.j));e&&e.Xc()};function ci(b){b=b?b:{};var c=Fg("DIV",b.className?b.className:"ol-mouse-position");mh.call(this,{element:c,render:b.render?b.render:di,target:b.target});D(this,hd("projection"),this.$l,!1,this);b.coordinateFormat&&this.bi(b.coordinateFormat);b.projection&&this.ih(Ee(b.projection));this.B=b.undefinedHTML?b.undefinedHTML:"";this.l=c.innerHTML;this.j=this.i=this.b=null}z(ci,mh);
function di(b){b=b.frameState;b?this.b!=b.viewState.projection&&(this.b=b.viewState.projection,this.i=null):this.b=null;ei(this,this.j)}l=ci.prototype;l.$l=function(){this.i=null};l.Bg=function(){return this.get("coordinateFormat")};l.hh=function(){return this.get("projection")};l.Tk=function(b){this.j=this.a.be(b.a);ei(this,this.j)};l.Uk=function(){ei(this,null);this.j=null};
l.setMap=function(b){ci.da.setMap.call(this,b);b&&(b=b.a,this.o.push(D(b,"mousemove",this.Tk,!1,this),D(b,"mouseout",this.Uk,!1,this)))};l.bi=function(b){this.set("coordinateFormat",b)};l.ih=function(b){this.set("projection",b)};function ei(b,c){var d=b.B;if(c&&b.b){if(!b.i){var e=b.hh();b.i=e?Ie(b.b,e):Xe}if(e=b.a.Ia(c))b.i(e,e),d=(d=b.Bg())?d(e):e.toString()}b.l&&d==b.l||(b.element.innerHTML=d,b.l=d)};function fi(b,c,d){mc.call(this);this.ya=null;this.b=!1;this.i=b;this.g=d;this.a=c||window;this.f=ta(this.c,this)}z(fi,mc);fi.prototype.start=function(){gi(this);this.b=!1;var b=hi(this),c=ii(this);b&&!c&&this.a.mozRequestAnimationFrame?(this.ya=D(this.a,"MozBeforePaint",this.f),this.a.mozRequestAnimationFrame(null),this.b=!0):this.ya=b&&c?b.call(this.a,this.f):this.a.setTimeout(ve(this.f),20)};
function gi(b){if(null!=b.ya){var c=hi(b),d=ii(b);c&&!d&&b.a.mozRequestAnimationFrame?Wc(b.ya):c&&d?d.call(b.a,b.ya):b.a.clearTimeout(b.ya)}b.ya=null}fi.prototype.c=function(){this.b&&this.ya&&Wc(this.ya);this.ya=null;this.i.call(this.g,va())};fi.prototype.X=function(){gi(this);fi.da.X.call(this)};function hi(b){b=b.a;return b.requestAnimationFrame||b.webkitRequestAnimationFrame||b.mozRequestAnimationFrame||b.oRequestAnimationFrame||b.msRequestAnimationFrame||null}
function ii(b){b=b.a;return b.cancelAnimationFrame||b.cancelRequestAnimationFrame||b.webkitCancelRequestAnimationFrame||b.mozCancelRequestAnimationFrame||b.oCancelRequestAnimationFrame||b.msCancelRequestAnimationFrame||null};function ji(b){ba.setTimeout(function(){throw b;},0)}function ki(b,c){var d=b;c&&(d=ta(b,c));d=li(d);!na(ba.setImmediate)||ba.Window&&ba.Window.prototype&&ba.Window.prototype.setImmediate==ba.setImmediate?(mi||(mi=ni()),mi(d)):ba.setImmediate(d)}var mi;
function ni(){var b=ba.MessageChannel;"undefined"===typeof b&&"undefined"!==typeof window&&window.postMessage&&window.addEventListener&&!Gb("Presto")&&(b=function(){var b=document.createElement("IFRAME");b.style.display="none";b.src="";document.documentElement.appendChild(b);var c=b.contentWindow,b=c.document;b.open();b.write("");b.close();var d="callImmediate"+Math.random(),e="file:"==c.location.protocol?"*":c.location.protocol+"//"+c.location.host,b=ta(function(b){if(("*"==e||b.origin==e)&&b.data==
d)this.port1.onmessage()},this);c.addEventListener("message",b,!1);this.port1={};this.port2={postMessage:function(){c.postMessage(d,e)}}});if("undefined"!==typeof b&&!Gb("Trident")&&!Gb("MSIE")){var c=new b,d={},e=d;c.port1.onmessage=function(){if(ca(d.next)){d=d.next;var b=d.rg;d.rg=null;b()}};return function(b){e.next={rg:b};e=e.next;c.port2.postMessage(0)}}return"undefined"!==typeof document&&"onreadystatechange"in document.createElement("SCRIPT")?function(b){var c=document.createElement("SCRIPT");
c.onreadystatechange=function(){c.onreadystatechange=null;c.parentNode.removeChild(c);c=null;b();b=null};document.documentElement.appendChild(c)}:function(b){ba.setTimeout(b,0)}}var li=ue;function oi(b,c){this.f={};this.a=[];this.b=0;var d=arguments.length;if(1<d){if(d%2)throw Error("Uneven number of arguments");for(var e=0;e<d;e+=2)this.set(arguments[e],arguments[e+1])}else if(b){if(b instanceof oi)e=b.P(),d=b.wc();else{var d=[],f=0;for(e in b)d[f++]=e;e=d;d=Kb(b)}for(f=0;f<e.length;f++)this.set(e[f],d[f])}}l=oi.prototype;l.sc=function(){return this.b};l.wc=function(){pi(this);for(var b=[],c=0;c<this.a.length;c++)b.push(this.f[this.a[c]]);return b};l.P=function(){pi(this);return this.a.concat()};
l.Na=function(){return 0==this.b};l.clear=function(){this.f={};this.b=this.a.length=0};l.remove=function(b){return qi(this.f,b)?(delete this.f[b],this.b--,this.a.length>2*this.b&&pi(this),!0):!1};function pi(b){if(b.b!=b.a.length){for(var c=0,d=0;c<b.a.length;){var e=b.a[c];qi(b.f,e)&&(b.a[d++]=e);c++}b.a.length=d}if(b.b!=b.a.length){for(var f={},d=c=0;c<b.a.length;)e=b.a[c],qi(f,e)||(b.a[d++]=e,f[e]=1),c++;b.a.length=d}}l.get=function(b,c){return qi(this.f,b)?this.f[b]:c};
l.set=function(b,c){qi(this.f,b)||(this.b++,this.a.push(b));this.f[b]=c};l.forEach=function(b,c){for(var d=this.P(),e=0;e<d.length;e++){var f=d[e],g=this.get(f);b.call(c,g,f,this)}};l.clone=function(){return new oi(this)};function qi(b,c){return Object.prototype.hasOwnProperty.call(b,c)};function ri(){this.a=va()}new ri;ri.prototype.set=function(b){this.a=b};ri.prototype.reset=function(){this.set(va())};ri.prototype.get=function(){return this.a};function si(b){$c.call(this);this.a=b||window;this.f=D(this.a,"resize",this.c,!1,this);this.b=Eg(this.a||window)}z(si,$c);si.prototype.X=function(){si.da.X.call(this);this.f&&(Wc(this.f),this.f=null);this.b=this.a=null};si.prototype.c=function(){var b=Eg(this.a||window),c=this.b;b==c||b&&c&&b.width==c.width&&b.height==c.height||(this.b=b,this.s("resize"))};function ti(b,c,d,e,f){if(!(Wb||Xb||Zb&&gc("525")))return!0;if($b&&f)return ui(b);if(f&&!e)return!1;ma(c)&&(c=vi(c));if(!d&&(17==c||18==c||$b&&91==c))return!1;if((Zb||Xb)&&e&&d)switch(b){case 220:case 219:case 221:case 192:case 186:case 189:case 187:case 188:case 190:case 191:case 192:case 222:return!1}if(Wb&&e&&c==b)return!1;switch(b){case 13:return!0;case 27:return!(Zb||Xb)}return ui(b)}
function ui(b){if(48<=b&&57>=b||96<=b&&106>=b||65<=b&&90>=b||(Zb||Xb)&&0==b)return!0;switch(b){case 32:case 43:case 63:case 64:case 107:case 109:case 110:case 111:case 186:case 59:case 189:case 187:case 61:case 188:case 190:case 191:case 192:case 222:case 219:case 220:case 221:return!0;default:return!1}}function vi(b){if(Yb)b=wi(b);else if($b&&Zb)a:switch(b){case 93:b=91;break a}return b}
function wi(b){switch(b){case 61:return 187;case 59:return 186;case 173:return 189;case 224:return 91;case 0:return 224;default:return b}};function xi(b,c){$c.call(this);b&&yi(this,b,c)}z(xi,$c);l=xi.prototype;l.xd=null;l.oe=null;l.wf=null;l.pe=null;l.lb=-1;l.ac=-1;l.ef=!1;
var zi={3:13,12:144,63232:38,63233:40,63234:37,63235:39,63236:112,63237:113,63238:114,63239:115,63240:116,63241:117,63242:118,63243:119,63244:120,63245:121,63246:122,63247:123,63248:44,63272:46,63273:36,63275:35,63276:33,63277:34,63289:144,63302:45},Ai={Up:38,Down:40,Left:37,Right:39,Enter:13,F1:112,F2:113,F3:114,F4:115,F5:116,F6:117,F7:118,F8:119,F9:120,F10:121,F11:122,F12:123,"U+007F":46,Home:36,End:35,PageUp:33,PageDown:34,Insert:45},Bi=Wb||Xb||Zb&&gc("525"),Ci=$b&&Yb;
xi.prototype.a=function(b){if(Zb||Xb)if(17==this.lb&&!b.o||18==this.lb&&!b.f||$b&&91==this.lb&&!b.B)this.ac=this.lb=-1;-1==this.lb&&(b.o&&17!=b.i?this.lb=17:b.f&&18!=b.i?this.lb=18:b.B&&91!=b.i&&(this.lb=91));Bi&&!ti(b.i,this.lb,b.c,b.o,b.f)?this.handleEvent(b):(this.ac=vi(b.i),Ci&&(this.ef=b.f))};xi.prototype.f=function(b){this.ac=this.lb=-1;this.ef=b.f};
xi.prototype.handleEvent=function(b){var c=b.a,d,e,f=c.altKey;Wb&&"keypress"==b.type?(d=this.ac,e=13!=d&&27!=d?c.keyCode:0):(Zb||Xb)&&"keypress"==b.type?(d=this.ac,e=0<=c.charCode&&63232>c.charCode&&ui(d)?c.charCode:0):Vb&&!Zb?(d=this.ac,e=ui(d)?c.keyCode:0):(d=c.keyCode||this.ac,e=c.charCode||0,Ci&&(f=this.ef),$b&&63==e&&224==d&&(d=191));var g=d=vi(d),h=c.keyIdentifier;d?63232<=d&&d in zi?g=zi[d]:25==d&&b.c&&(g=9):h&&h in Ai&&(g=Ai[h]);this.lb=g;b=new Di(g,e,0,c);b.f=f;this.s(b)};
function yi(b,c,d){b.pe&&Ei(b);b.xd=c;b.oe=D(b.xd,"keypress",b,d);b.wf=D(b.xd,"keydown",b.a,d,b);b.pe=D(b.xd,"keyup",b.f,d,b)}function Ei(b){b.oe&&(Wc(b.oe),Wc(b.wf),Wc(b.pe),b.oe=null,b.wf=null,b.pe=null);b.xd=null;b.lb=-1;b.ac=-1}xi.prototype.X=function(){xi.da.X.call(this);Ei(this)};function Di(b,c,d,e){wc.call(this,e);this.type="key";this.i=b;this.G=c}z(Di,wc);function Fi(b,c){$c.call(this);var d=this.a=b;(d=oa(d)&&1==d.nodeType?this.a:this.a?this.a.body:null)&&Yg(d,"direction");this.f=D(this.a,Yb?"DOMMouseScroll":"mousewheel",this,c)}z(Fi,$c);
Fi.prototype.handleEvent=function(b){var c=0,d=0;b=b.a;if("mousewheel"==b.type){c=1;if(Wb||Zb&&(ac||gc("532.0")))c=40;d=Gi(-b.wheelDelta,c);c=ca(b.wheelDeltaX)?Gi(-b.wheelDeltaY,c):d}else d=b.detail,100<d?d=3:-100>d&&(d=-3),ca(b.axis)&&b.axis===b.HORIZONTAL_AXIS||(c=d);ma(this.b)&&(c=Math.min(Math.max(c,-this.b),this.b));d=new Hi(d,b,0,c);this.s(d)};function Gi(b,c){return Zb&&($b||bc)&&0!=b%c?b:b/c}Fi.prototype.X=function(){Fi.da.X.call(this);Wc(this.f);this.f=null};
function Hi(b,c,d,e){wc.call(this,c);this.type="mousewheel";this.detail=b;this.v=e}z(Hi,wc);function Ii(b,c,d){rc.call(this,b);this.a=c;b=d?d:{};this.buttons=Ji(b);this.pressure=Ki(b,this.buttons);this.bubbles="bubbles"in b?b.bubbles:!1;this.cancelable="cancelable"in b?b.cancelable:!1;this.view="view"in b?b.view:null;this.detail="detail"in b?b.detail:null;this.screenX="screenX"in b?b.screenX:0;this.screenY="screenY"in b?b.screenY:0;this.clientX="clientX"in b?b.clientX:0;this.clientY="clientY"in b?b.clientY:0;this.button="button"in b?b.button:0;this.relatedTarget="relatedTarget"in b?b.relatedTarget:
null;this.pointerId="pointerId"in b?b.pointerId:0;this.width="width"in b?b.width:0;this.height="height"in b?b.height:0;this.pointerType="pointerType"in b?b.pointerType:"";this.isPrimary="isPrimary"in b?b.isPrimary:!1;c.preventDefault&&(this.preventDefault=function(){c.preventDefault()})}z(Ii,rc);function Ji(b){if(b.buttons||Li)b=b.buttons;else switch(b.which){case 1:b=1;break;case 2:b=4;break;case 3:b=2;break;default:b=0}return b}
function Ki(b,c){var d=0;b.pressure?d=b.pressure:d=c?.5:0;return d}var Li=!1;try{Li=1===(new MouseEvent("click",{buttons:1})).buttons}catch(b){};function Mi(b,c){var d=document.createElement("CANVAS");b&&(d.width=b);c&&(d.height=c);return d.getContext("2d")}
var Ni=function(){var b;return function(){if(void 0===b)if(ba.getComputedStyle){var c=document.createElement("P"),d,e={webkitTransform:"-webkit-transform",OTransform:"-o-transform",msTransform:"-ms-transform",MozTransform:"-moz-transform",transform:"transform"};document.body.appendChild(c);for(var f in e)f in c.style&&(c.style[f]="translate(1px,1px)",d=ba.getComputedStyle(c).getPropertyValue(e[f]));Kg(c);b=d&&"none"!==d}else b=!1;return b}}(),Oi=function(){var b;return function(){if(void 0===b)if(ba.getComputedStyle){var c=
document.createElement("P"),d,e={webkitTransform:"-webkit-transform",OTransform:"-o-transform",msTransform:"-ms-transform",MozTransform:"-moz-transform",transform:"transform"};document.body.appendChild(c);for(var f in e)f in c.style&&(c.style[f]="translate3d(1px,1px,1px)",d=ba.getComputedStyle(c).getPropertyValue(e[f]));Kg(c);b=d&&"none"!==d}else b=!1;return b}}();
function Pi(b,c){var d=b.style;d.WebkitTransform=c;d.MozTransform=c;d.a=c;d.msTransform=c;d.transform=c;Wb&&gc("9.0")&&(b.style.transformOrigin="0 0")}function Qi(b,c){var d;if(Oi()){var e=Array(16);for(d=0;16>d;++d)e[d]=c[d].toFixed(6);Pi(b,"matrix3d("+e.join(",")+")")}else if(Ni()){var e=[c[0],c[1],c[4],c[5],c[12],c[13]],f=Array(6);for(d=0;6>d;++d)f[d]=e[d].toFixed(6);Pi(b,"matrix("+f.join(",")+")")}else b.style.left=Math.round(c[12])+"px",b.style.top=Math.round(c[13])+"px"};var Ri=["experimental-webgl","webgl","webkit-3d","moz-webgl"];function Si(b,c){var d,e,f=Ri.length;for(e=0;e<f;++e)try{if(d=b.getContext(Ri[e],c))return d}catch(g){}return null};var Ti,Ui=ba.devicePixelRatio||1,Vi=!1,Wi=function(){if(!("HTMLCanvasElement"in ba))return!1;try{var b=Mi();return b?(void 0!==b.setLineDash&&(Vi=!0),!0):!1}catch(c){return!1}}(),Xi="DeviceOrientationEvent"in ba,Yi="geolocation"in ba.navigator,Zi="ontouchstart"in ba,$i="PointerEvent"in ba,aj=!!ba.navigator.msPointerEnabled,bj=!1,cj,dj=[];
if("WebGLRenderingContext"in ba)try{var ej=Si(document.createElement("CANVAS"),{failIfMajorPerformanceCaveat:!0});ej&&(bj=!0,cj=ej.getParameter(ej.MAX_TEXTURE_SIZE),dj=ej.getSupportedExtensions())}catch(b){}Ti=bj;xa=dj;wa=cj;function fj(b,c){this.a=b;this.g=c};function gj(b){fj.call(this,b,{mousedown:this.ql,mousemove:this.rl,mouseup:this.ul,mouseover:this.tl,mouseout:this.sl});this.f=b.f;this.b=[]}z(gj,fj);function hj(b,c){for(var d=b.b,e=c.clientX,f=c.clientY,g=0,h=d.length,k;g<h&&(k=d[g]);g++){var m=Math.abs(f-k[1]);if(25>=Math.abs(e-k[0])&&25>=m)return!0}return!1}function ij(b){var c=jj(b,b.a),d=c.preventDefault;c.preventDefault=function(){b.preventDefault();d()};c.pointerId=1;c.isPrimary=!0;c.pointerType="mouse";return c}l=gj.prototype;
l.ql=function(b){if(!hj(this,b)){(1).toString()in this.f&&this.cancel(b);var c=ij(b);this.f[(1).toString()]=b;kj(this.a,lj,c,b)}};l.rl=function(b){if(!hj(this,b)){var c=ij(b);kj(this.a,mj,c,b)}};l.ul=function(b){if(!hj(this,b)){var c=this.f[(1).toString()];c&&c.button===b.button&&(c=ij(b),kj(this.a,nj,c,b),delete this.f[(1).toString()])}};l.tl=function(b){if(!hj(this,b)){var c=ij(b);oj(this.a,c,b)}};l.sl=function(b){if(!hj(this,b)){var c=ij(b);pj(this.a,c,b)}};
l.cancel=function(b){var c=ij(b);this.a.cancel(c,b);delete this.f[(1).toString()]};function qj(b){fj.call(this,b,{MSPointerDown:this.zl,MSPointerMove:this.Al,MSPointerUp:this.Dl,MSPointerOut:this.Bl,MSPointerOver:this.Cl,MSPointerCancel:this.yl,MSGotPointerCapture:this.wl,MSLostPointerCapture:this.xl});this.f=b.f;this.b=["","unavailable","touch","pen","mouse"]}z(qj,fj);function rj(b,c){var d=c;ma(c.a.pointerType)&&(d=jj(c,c.a),d.pointerType=b.b[c.a.pointerType]);return d}l=qj.prototype;l.zl=function(b){this.f[b.a.pointerId.toString()]=b;var c=rj(this,b);kj(this.a,lj,c,b)};
l.Al=function(b){var c=rj(this,b);kj(this.a,mj,c,b)};l.Dl=function(b){var c=rj(this,b);kj(this.a,nj,c,b);delete this.f[b.a.pointerId.toString()]};l.Bl=function(b){var c=rj(this,b);pj(this.a,c,b)};l.Cl=function(b){var c=rj(this,b);oj(this.a,c,b)};l.yl=function(b){var c=rj(this,b);this.a.cancel(c,b);delete this.f[b.a.pointerId.toString()]};l.xl=function(b){this.a.s(new Ii("lostpointercapture",b,b.a))};l.wl=function(b){this.a.s(new Ii("gotpointercapture",b,b.a))};function sj(b){fj.call(this,b,{pointerdown:this.co,pointermove:this.eo,pointerup:this.io,pointerout:this.fo,pointerover:this.ho,pointercancel:this.bo,gotpointercapture:this.Ck,lostpointercapture:this.pl})}z(sj,fj);l=sj.prototype;l.co=function(b){tj(this.a,b)};l.eo=function(b){tj(this.a,b)};l.io=function(b){tj(this.a,b)};l.fo=function(b){tj(this.a,b)};l.ho=function(b){tj(this.a,b)};l.bo=function(b){tj(this.a,b)};l.pl=function(b){tj(this.a,b)};l.Ck=function(b){tj(this.a,b)};function uj(b,c){fj.call(this,b,{touchstart:this.jp,touchmove:this.ip,touchend:this.hp,touchcancel:this.gp});this.f=b.f;this.j=c;this.b=void 0;this.i=0;this.c=void 0}z(uj,fj);l=uj.prototype;l.Yh=function(){this.i=0;this.c=void 0};
function vj(b,c,d){c=jj(c,d);c.pointerId=d.identifier+2;c.bubbles=!0;c.cancelable=!0;c.detail=b.i;c.button=0;c.buttons=1;c.width=d.webkitRadiusX||d.radiusX||0;c.height=d.webkitRadiusY||d.radiusY||0;c.pressure=d.webkitForce||d.force||.5;c.isPrimary=b.b===d.identifier;c.pointerType="touch";c.clientX=d.clientX;c.clientY=d.clientY;c.screenX=d.screenX;c.screenY=d.screenY;return c}
function wj(b,c,d){function e(){c.preventDefault()}var f=Array.prototype.slice.call(c.a.changedTouches),g=f.length,h,k;for(h=0;h<g;++h)k=vj(b,c,f[h]),k.preventDefault=e,d.call(b,c,k)}
l.jp=function(b){var c=b.a.touches,d=Object.keys(this.f),e=d.length;if(e>=c.length){var f=[],g,h,k;for(g=0;g<e;++g){h=d[g];k=this.f[h];var m;if(!(m=1==h))a:{m=c.length;for(var n=void 0,p=0;p<m;p++)if(n=c[p],n.identifier===h-2){m=!0;break a}m=!1}m||f.push(k.Ac)}for(g=0;g<f.length;++g)this.gf(b,f[g])}c=Jb(this.f);if(0===c||1===c&&(1).toString()in this.f)this.b=b.a.changedTouches[0].identifier,void 0!==this.c&&ba.clearTimeout(this.c);yj(this,b);this.i++;wj(this,b,this.Yn)};
l.Yn=function(b,c){this.f[c.pointerId]={target:c.target,Ac:c,Gh:c.target};var d=this.a;c.bubbles=!0;kj(d,zj,c,b);d=this.a;c.bubbles=!1;kj(d,Aj,c,b);kj(this.a,lj,c,b)};l.ip=function(b){b.preventDefault();wj(this,b,this.vl)};l.vl=function(b,c){var d=this.f[c.pointerId];if(d){var e=d.Ac,f=d.Gh;kj(this.a,mj,c,b);e&&f!==c.target&&(e.relatedTarget=c.target,c.relatedTarget=f,e.target=f,c.target?(pj(this.a,e,b),oj(this.a,c,b)):(c.target=f,c.relatedTarget=null,this.gf(b,c)));d.Ac=c;d.Gh=c.target}};
l.hp=function(b){yj(this,b);wj(this,b,this.kp)};l.kp=function(b,c){kj(this.a,nj,c,b);this.a.Ac(c,b);var d=this.a;c.bubbles=!1;kj(d,Bj,c,b);delete this.f[c.pointerId];c.isPrimary&&(this.b=void 0,this.c=ba.setTimeout(this.Yh.bind(this),200))};l.gp=function(b){wj(this,b,this.gf)};l.gf=function(b,c){this.a.cancel(c,b);this.a.Ac(c,b);var d=this.a;c.bubbles=!1;kj(d,Bj,c,b);delete this.f[c.pointerId];c.isPrimary&&(this.b=void 0,this.c=ba.setTimeout(this.Yh.bind(this),200))};
function yj(b,c){var d=b.j.b,e=c.a.changedTouches[0];if(b.b===e.identifier){var f=[e.clientX,e.clientY];d.push(f);ba.setTimeout(function(){gb(d,f)},2500)}};function Cj(b){$c.call(this);this.c=b;this.f={};this.b={};this.a=[];$i?Dj(this,new sj(this)):aj?Dj(this,new qj(this)):(b=new gj(this),Dj(this,b),Zi&&Dj(this,new uj(this,b)));b=this.a.length;for(var c,d=0;d<b;d++)c=this.a[d],Ej(this,Object.keys(c.g))}z(Cj,$c);function Dj(b,c){var d=Object.keys(c.g);d&&(d.forEach(function(b){var d=c.g[b];d&&(this.b[b]=d.bind(c))},b),b.a.push(c))}Cj.prototype.g=function(b){var c=this.b[b.type];c&&c(b)};
function Ej(b,c){c.forEach(function(b){D(this.c,b,this.g,!1,this)},b)}function Fj(b,c){c.forEach(function(b){Vc(this.c,b,this.g,!1,this)},b)}function jj(b,c){for(var d={},e,f=0,g=Gj.length;f<g;f++)e=Gj[f][0],d[e]=b[e]||c[e]||Gj[f][1];return d}Cj.prototype.Ac=function(b,c){b.bubbles=!0;kj(this,Hj,b,c)};Cj.prototype.cancel=function(b,c){kj(this,Ij,b,c)};function pj(b,c,d){b.Ac(c,d);var e=c.relatedTarget;e&&Ng(c.target,e)||(c.bubbles=!1,kj(b,Bj,c,d))}
function oj(b,c,d){c.bubbles=!0;kj(b,zj,c,d);var e=c.relatedTarget;e&&Ng(c.target,e)||(c.bubbles=!1,kj(b,Aj,c,d))}function kj(b,c,d,e){b.s(new Ii(c,e,d))}function tj(b,c){b.s(new Ii(c.type,c,c.a))}Cj.prototype.X=function(){for(var b=this.a.length,c,d=0;d<b;d++)c=this.a[d],Fj(this,Object.keys(c.g));Cj.da.X.call(this)};
var mj="pointermove",lj="pointerdown",nj="pointerup",zj="pointerover",Hj="pointerout",Aj="pointerenter",Bj="pointerleave",Ij="pointercancel",Gj=[["bubbles",!1],["cancelable",!1],["view",null],["detail",null],["screenX",0],["screenY",0],["clientX",0],["clientY",0],["ctrlKey",!1],["altKey",!1],["shiftKey",!1],["metaKey",!1],["button",0],["relatedTarget",null],["buttons",0],["pointerId",0],["width",0],["height",0],["pressure",0],["tiltX",0],["tiltY",0],["pointerType",""],["hwTimestamp",0],["isPrimary",
!1],["type",""],["target",null],["currentTarget",null],["which",0]];function Jj(b,c,d,e,f){lh.call(this,b,c,f);this.a=d;this.originalEvent=d.a;this.pixel=c.be(this.originalEvent);this.coordinate=c.Ia(this.pixel);this.dragging=void 0!==e?e:!1}z(Jj,lh);Jj.prototype.preventDefault=function(){Jj.da.preventDefault.call(this);this.a.preventDefault()};Jj.prototype.b=function(){Jj.da.b.call(this);this.a.b()};function Kj(b,c,d,e,f){Jj.call(this,b,c,d.a,e,f);this.f=d}z(Kj,Jj);
function Lj(b){$c.call(this);this.b=b;this.i=0;this.j=!1;this.f=this.l=this.c=null;b=this.b.a;this.B=0;this.G={};this.g=new Cj(b);this.a=null;this.l=D(this.g,lj,this.Xk,!1,this);this.o=D(this.g,mj,this.Fo,!1,this)}z(Lj,$c);function Mj(b,c){var d;d=new Kj(Nj,b.b,c);b.s(d);0!==b.i?(ba.clearTimeout(b.i),b.i=0,d=new Kj(Oj,b.b,c),b.s(d)):b.i=ba.setTimeout(function(){this.i=0;var b=new Kj(Pj,this.b,c);this.s(b)}.bind(b),250)}
function Qj(b,c){c.type==Rj||c.type==Sj?delete b.G[c.pointerId]:c.type==Tj&&(b.G[c.pointerId]=!0);b.B=Jb(b.G)}l=Lj.prototype;l.Qg=function(b){Qj(this,b);var c=new Kj(Rj,this.b,b);this.s(c);!this.j&&0===b.button&&Mj(this,this.f);0===this.B&&(this.c.forEach(Wc),this.c=null,this.j=!1,this.f=null,qc(this.a),this.a=null)};
l.Xk=function(b){Qj(this,b);var c=new Kj(Tj,this.b,b);this.s(c);this.f=b;this.c||(this.a=new Cj(document),this.c=[D(this.a,Uj,this.Ql,!1,this),D(this.a,Rj,this.Qg,!1,this),D(this.g,Sj,this.Qg,!1,this)])};l.Ql=function(b){if(b.clientX!=this.f.clientX||b.clientY!=this.f.clientY){this.j=!0;var c=new Kj(Vj,this.b,b,this.j);this.s(c)}b.preventDefault()};l.Fo=function(b){this.s(new Kj(b.type,this.b,b,!(!this.f||b.clientX==this.f.clientX&&b.clientY==this.f.clientY)))};
l.X=function(){this.o&&(Wc(this.o),this.o=null);this.l&&(Wc(this.l),this.l=null);this.c&&(this.c.forEach(Wc),this.c=null);this.a&&(qc(this.a),this.a=null);this.g&&(qc(this.g),this.g=null);Lj.da.X.call(this)};var Pj="singleclick",Nj="click",Oj="dblclick",Vj="pointerdrag",Uj="pointermove",Tj="pointerdown",Rj="pointerup",Sj="pointercancel",Wj={Cp:Pj,rp:Nj,sp:Oj,vp:Vj,yp:Uj,up:Tj,Bp:Rj,Ap:"pointerover",zp:"pointerout",wp:"pointerenter",xp:"pointerleave",tp:Sj};function Xj(b){fd.call(this);var c=Rb(b);c.opacity=void 0!==b.opacity?b.opacity:1;c.visible=void 0!==b.visible?b.visible:!0;c.zIndex=void 0!==b.zIndex?b.zIndex:0;c.maxResolution=void 0!==b.maxResolution?b.maxResolution:Infinity;c.minResolution=void 0!==b.minResolution?b.minResolution:0;this.I(c)}z(Xj,fd);
function Yj(b){var c=b.Sb(),d=b.uf(),e=b.tb(),f=b.J(),g=b.Tb(),h=b.Ob(),k=b.Pb();return{layer:b,opacity:Ra(c,0,1),O:d,visible:e,Db:!0,extent:f,zIndex:g,maxResolution:h,minResolution:Math.max(k,0)}}l=Xj.prototype;l.J=function(){return this.get("extent")};l.Ob=function(){return this.get("maxResolution")};l.Pb=function(){return this.get("minResolution")};l.Sb=function(){return this.get("opacity")};l.tb=function(){return this.get("visible")};l.Tb=function(){return this.get("zIndex")};
l.dc=function(b){this.set("extent",b)};l.lc=function(b){this.set("maxResolution",b)};l.mc=function(b){this.set("minResolution",b)};l.ec=function(b){this.set("opacity",b)};l.fc=function(b){this.set("visible",b)};l.gc=function(b){this.set("zIndex",b)};function Zj(){};function ak(b,c,d,e,f,g){rc.call(this,b,c);this.vectorContext=d;this.frameState=e;this.context=f;this.glContext=g}z(ak,rc);function bk(b){var c=Rb(b);delete c.source;Xj.call(this,c);this.i=this.B=this.o=null;b.map&&this.setMap(b.map);D(this,hd("source"),this.dl,!1,this);this.Dc(b.source?b.source:null)}z(bk,Xj);function ck(b,c){return b.visible&&c>=b.minResolution&&c<b.maxResolution}l=bk.prototype;l.sf=function(b){b=b?b:[];b.push(Yj(this));return b};l.ea=function(){return this.get("source")||null};l.uf=function(){var b=this.ea();return b?b.B:"undefined"};l.Hm=function(){this.u()};
l.dl=function(){this.i&&(Wc(this.i),this.i=null);var b=this.ea();b&&(this.i=D(b,"change",this.Hm,!1,this));this.u()};l.setMap=function(b){Wc(this.o);this.o=null;b||this.u();Wc(this.B);this.B=null;b&&(this.o=D(b,"precompose",function(b){var d=Yj(this);d.Db=!1;d.zIndex=Infinity;b.frameState.layerStatesArray.push(d);b.frameState.layerStates[w(this)]=d},!1,this),this.B=D(this,"change",b.render,!1,b),this.u())};l.Dc=function(b){this.set("source",b)};function dk(b,c,d,e,f){$c.call(this);this.i=f;this.extent=b;this.b=d;this.resolution=c;this.state=e}z(dk,$c);function ek(b){b.s("change")}dk.prototype.J=function(){return this.extent};dk.prototype.$=function(){return this.resolution};function fk(b,c,d,e,f,g,h,k){Ed(b);0===c&&0===d||Hd(b,c,d);1==e&&1==f||Id(b,e,f);0!==g&&Jd(b,g);0===h&&0===k||Hd(b,h,k);return b}function gk(b,c){return b[0]==c[0]&&b[1]==c[1]&&b[4]==c[4]&&b[5]==c[5]&&b[12]==c[12]&&b[13]==c[13]}function hk(b,c,d){var e=b[1],f=b[5],g=b[13],h=c[0];c=c[1];d[0]=b[0]*h+b[4]*c+b[12];d[1]=e*h+f*c+g;return d};function ik(b){cd.call(this);this.a=b}z(ik,cd);l=ik.prototype;l.cb=ya;l.zc=function(b,c,d,e){b=b.slice();hk(c.pixelToCoordinateMatrix,b,b);if(this.cb(b,c,se,this))return d.call(e,this.a)};l.ze=re;l.ed=function(b,c,d){return function(e,f){return Mh(b,c,e,f,function(b){d[e]||(d[e]={});d[e][b.ga.toString()]=b})}};l.Lm=function(b){2===b.target.state&&jk(this)};function kk(b,c){var d=c.state;2!=d&&3!=d&&D(c,"change",b.Lm,!1,b);0==d&&(c.load(),d=c.state);return 2==d}
function jk(b){var c=b.a;c.tb()&&"ready"==c.uf()&&b.u()}function lk(b,c){c.wh()&&b.postRenderFunctions.push(ua(function(b,c,f){c=w(b).toString();b.xh(f.viewState.projection,f.usedTiles[c])},c))}function mk(b,c){if(c){var d,e,f;e=0;for(f=c.length;e<f;++e)d=c[e],b[w(d).toString()]=d}}function nk(b,c){var d=c.U;void 0!==d&&(la(d)?b.logos[d]="":oa(d)&&(b.logos[d.src]=d.href))}
function ok(b,c,d,e){c=w(c).toString();d=d.toString();c in b?d in b[c]?(b=b[c][d],e.a<b.a&&(b.a=e.a),e.c>b.c&&(b.c=e.c),e.f<b.f&&(b.f=e.f),e.b>b.b&&(b.b=e.b)):b[c][d]=e:(b[c]={},b[c][d]=e)}function pk(b,c,d){return[c*(Math.round(b[0]/c)+d[0]%2/2),c*(Math.round(b[1]/c)+d[1]%2/2)]}
function qk(b,c,d,e,f,g,h,k,m,n){var p=w(c).toString();p in b.wantedTiles||(b.wantedTiles[p]={});var q=b.wantedTiles[p];b=b.tileQueue;var r=d.minZoom,t,v,x,C,A,y;for(y=h;y>=r;--y)for(v=Bh(d,g,y,v),x=d.$(y),C=v.a;C<=v.c;++C)for(A=v.f;A<=v.b;++A)h-y<=k?(t=c.Qb(y,C,A,e,f),0==t.state&&(q[t.ga.toString()]=!0,t.bb()in b.b||b.c([t,p,Fh(d,t.ga),x])),void 0!==m&&m.call(n,t)):c.bg(y,C,A,f)};function rk(b){this.B=b.opacity;this.C=b.rotateWithView;this.G=b.rotation;this.j=b.scale;this.D=b.snapToPixel}l=rk.prototype;l.De=function(){return this.B};l.fe=function(){return this.C};l.Ee=function(){return this.G};l.Fe=function(){return this.j};l.ge=function(){return this.D};l.Ge=function(b){this.B=b};l.He=function(b){this.G=b};l.Ie=function(b){this.j=b};function sk(b){b=b||{};this.g=void 0!==b.anchor?b.anchor:[.5,.5];this.c=null;this.f=void 0!==b.anchorOrigin?b.anchorOrigin:"top-left";this.l=void 0!==b.anchorXUnits?b.anchorXUnits:"fraction";this.o=void 0!==b.anchorYUnits?b.anchorYUnits:"fraction";var c=void 0!==b.crossOrigin?b.crossOrigin:null,d=void 0!==b.img?b.img:null,e=void 0!==b.imgSize?b.imgSize:null,f=b.src;void 0!==f&&0!==f.length||!d||(f=d.src||w(d).toString());var g=void 0!==b.src?0:2,h=void 0!==b.color?rg(b.color):null,k=tk.Zb(),m=k.get(f,
c,h);m||(m=new uk(d,f,e,c,g,h),k.set(f,c,h,m));this.a=m;this.O=void 0!==b.offset?b.offset:[0,0];this.b=void 0!==b.offsetOrigin?b.offsetOrigin:"top-left";this.i=null;this.v=void 0!==b.size?b.size:null;rk.call(this,{opacity:void 0!==b.opacity?b.opacity:1,rotation:void 0!==b.rotation?b.rotation:0,scale:void 0!==b.scale?b.scale:1,snapToPixel:void 0!==b.snapToPixel?b.snapToPixel:!0,rotateWithView:void 0!==b.rotateWithView?b.rotateWithView:!1})}z(sk,rk);l=sk.prototype;
l.Yb=function(){if(this.c)return this.c;var b=this.g,c=this.Eb();if("fraction"==this.l||"fraction"==this.o){if(!c)return null;b=this.g.slice();"fraction"==this.l&&(b[0]*=c[0]);"fraction"==this.o&&(b[1]*=c[1])}if("top-left"!=this.f){if(!c)return null;b===this.g&&(b=this.g.slice());if("top-right"==this.f||"bottom-right"==this.f)b[0]=-b[0]+c[0];if("bottom-left"==this.f||"bottom-right"==this.f)b[1]=-b[1]+c[1]}return this.c=b};l.hc=function(){var b=this.a;return b.c?b.c:b.a};l.td=function(){return this.a.b};
l.Ed=function(){return this.a.f};l.Ce=function(){var b=this.a;if(!b.j)if(b.o){var c=b.b[0],d=b.b[1],e=Mi(c,d);e.fillRect(0,0,c,d);b.j=e.canvas}else b.j=b.a;return b.j};l.Ea=function(){if(this.i)return this.i;var b=this.O;if("top-left"!=this.b){var c=this.Eb(),d=this.a.b;if(!c||!d)return null;b=b.slice();if("top-right"==this.b||"bottom-right"==this.b)b[0]=d[0]-c[0]-b[0];if("bottom-left"==this.b||"bottom-right"==this.b)b[1]=d[1]-c[1]-b[1]}return this.i=b};l.rn=function(){return this.a.l};
l.Eb=function(){return this.v?this.v:this.a.b};l.yf=function(b,c){return D(this.a,"change",b,!1,c)};l.load=function(){this.a.load()};l.ag=function(b,c){Vc(this.a,"change",b,!1,c)};function uk(b,c,d,e,f,g){$c.call(this);this.j=null;this.a=b?b:new Image;null!==e&&(this.a.crossOrigin=e);this.c=g?document.createElement("CANVAS"):null;this.i=g;this.g=null;this.f=f;this.b=d;this.l=c;this.o=!1;2==this.f&&vk(this)}z(uk,$c);
function vk(b){var c=Mi(1,1);try{c.drawImage(b.a,0,0),c.getImageData(0,0,1,1)}catch(d){b.o=!0}}uk.prototype.G=function(){this.f=3;this.g.forEach(Wc);this.g=null;this.s("change")};
uk.prototype.B=function(){this.f=2;this.b=[this.a.width,this.a.height];this.g.forEach(Wc);this.g=null;vk(this);if(!this.o&&null!==this.i){this.c.width=this.a.width;this.c.height=this.a.height;var b=this.c.getContext("2d");b.drawImage(this.a,0,0);for(var c=b.getImageData(0,0,this.a.width,this.a.height),d=c.data,e=this.i[0]/255,f=this.i[1]/255,g=this.i[2]/255,h=0,k=d.length;h<k;h+=4)d[h]*=e,d[h+1]*=f,d[h+2]*=g;b.putImageData(c,0,0)}this.s("change")};
uk.prototype.load=function(){if(0==this.f){this.f=1;this.g=[Uc(this.a,"error",this.G,!1,this),Uc(this.a,"load",this.B,!1,this)];try{this.a.src=this.l}catch(b){this.G()}}};function tk(){this.a={};this.f=0}ea(tk);tk.prototype.clear=function(){this.a={};this.f=0};tk.prototype.get=function(b,c,d){b=c+":"+b+":"+(d?tg(d):"null");return b in this.a?this.a[b]:null};tk.prototype.set=function(b,c,d,e){this.a[c+":"+b+":"+(d?tg(d):"null")]=e;++this.f};function wk(b,c){mc.call(this);this.i=c;this.c={};this.G={}}z(wk,mc);function xk(b){var c=b.viewState,d=b.coordinateToPixelMatrix;fk(d,b.size[0]/2,b.size[1]/2,1/c.resolution,-1/c.resolution,-c.rotation,-c.center[0],-c.center[1]);Gd(d,b.pixelToCoordinateMatrix)}l=wk.prototype;l.X=function(){Hb(this.c,qc);wk.da.X.call(this)};
function yk(){var b=tk.Zb();if(32<b.f){var c=0,d,e;for(d in b.a){e=b.a[d];var f;if(f=0===(c++&3))Bc(e)?e=bd(e,void 0,void 0):(e=Qc(e),e=!!e&&Kc(e,void 0,void 0)),f=!e;f&&(delete b.a[d],--b.f)}}}
l.Ff=function(b,c,d,e,f,g){function h(b){var c=w(b).toString();if(!(c in p))return p[c]=!0,d.call(e,b,null)}var k,m=c.viewState,n=m.resolution,p={},q=m.projection,m=b;if(q.f){var q=q.J(),r=ie(q),t=b[0];if(t<q[0]||t>q[2])m=[t+r*Math.ceil((q[0]-t)/r),b[1]]}q=c.layerStatesArray;for(r=q.length-1;0<=r;--r){var t=q[r],v=t.layer;if(ck(t,n)&&f.call(g,v)){var x=zk(this,v);v.ea()&&(k=x.cb(vh(v.ea())?m:b,c,t.Db?d:h,e));if(k)return k}}};
l.rh=function(b,c,d,e,f,g){var h,k=c.viewState.resolution,m=c.layerStatesArray,n;for(n=m.length-1;0<=n;--n){h=m[n];var p=h.layer;if(ck(h,k)&&f.call(g,p)&&(h=zk(this,p).zc(b,c,d,e)))return h}};l.sh=function(b,c,d,e){return void 0!==this.Ff(b,c,se,this,d,e)};function zk(b,c){var d=w(c).toString();if(d in b.c)return b.c[d];var e=b.kf(c);b.c[d]=e;b.G[d]=D(e,"change",b.Nk,!1,b);return e}l.Nk=function(){this.i.render()};l.Pe=ya;
l.Lo=function(b,c){for(var d in this.c)if(!(c&&d in c.layerStates)){var e=d,f=this.c[e];delete this.c[e];Wc(this.G[e]);delete this.G[e];qc(f)}};function Ak(b,c){for(var d in b.c)if(!(d in c.layerStates)){c.postRenderFunctions.push(b.Lo.bind(b));break}}function pb(b,c){return b.zIndex-c.zIndex};function Bk(b,c){this.o=b;this.i=c;this.a=[];this.f=[];this.b={}}Bk.prototype.clear=function(){this.a.length=0;this.f.length=0;Ob(this.b)};function Ck(b){var c=b.a,d=b.f,e=c[0];1==c.length?(c.length=0,d.length=0):(c[0]=c.pop(),d[0]=d.pop(),Dk(b,0));c=b.i(e);delete b.b[c];return e}Bk.prototype.c=function(b){var c=this.o(b);return Infinity!=c?(this.a.push(b),this.f.push(c),this.b[this.i(b)]=!0,Ek(this,0,this.a.length-1),!0):!1};Bk.prototype.sc=function(){return this.a.length};
Bk.prototype.Na=function(){return 0===this.a.length};function Dk(b,c){for(var d=b.a,e=b.f,f=d.length,g=d[c],h=e[c],k=c;c<f>>1;){var m=2*c+1,n=2*c+2,m=n<f&&e[n]<e[m]?n:m;d[c]=d[m];e[c]=e[m];c=m}d[c]=g;e[c]=h;Ek(b,k,c)}function Ek(b,c,d){var e=b.a;b=b.f;for(var f=e[d],g=b[d];d>c;){var h=d-1>>1;if(b[h]>g)e[d]=e[h],b[d]=b[h],d=h;else break}e[d]=f;b[d]=g}
function Fk(b){var c=b.o,d=b.a,e=b.f,f=0,g=d.length,h,k,m;for(k=0;k<g;++k)h=d[k],m=c(h),Infinity==m?delete b.b[b.i(h)]:(e[f]=m,d[f++]=h);d.length=f;e.length=f;for(c=(b.a.length>>1)-1;0<=c;c--)Dk(b,c)};function Gk(b,c){Bk.call(this,function(c){return b.apply(null,c)},function(b){return b[0].bb()});this.G=c;this.g=0;this.j={}}z(Gk,Bk);Gk.prototype.c=function(b){var c=Gk.da.c.call(this,b);c&&D(b[0],"change",this.l,!1,this);return c};Gk.prototype.l=function(b){b=b.target;var c=b.state;if(2===c||3===c||4===c)Vc(b,"change",this.l,!1,this),b=b.bb(),b in this.j&&(delete this.j[b],--this.g),this.G()};
function Hk(b,c,d){for(var e=0,f;b.g<c&&e<d&&0<b.sc();)f=Ck(b)[0],0===f.state&&(b.j[f.bb()]=!0,++b.g,++e,f.load())};function Ik(b,c,d){this.c=b;this.b=c;this.i=d;this.a=[];this.f=this.g=0}function Jk(b,c){var d=b.c,e=b.f,f=b.b-e,g=Math.log(b.b/b.f)/b.c;return Yf({source:c,duration:g,easing:function(b){return e*(Math.exp(d*b*g)-1)/f}})};function Kk(b){fd.call(this);this.B=null;this.g(!0);this.handleEvent=b.handleEvent}z(Kk,fd);Kk.prototype.b=function(){return this.get("active")};Kk.prototype.i=function(){return this.B};Kk.prototype.g=function(b){this.set("active",b)};Kk.prototype.setMap=function(b){this.B=b};function Lk(b,c,d,e,f){if(void 0!==d){var g=c.Ha(),h=c.Va();void 0!==g&&h&&f&&0<f&&(b.Pa(Zf({rotation:g,duration:f,easing:Uf})),e&&b.Pa(Yf({source:h,duration:f,easing:Uf})));c.rotate(d,e)}}
function Mk(b,c,d,e,f){var g=c.$();d=c.constrainResolution(g,d,0);Nk(b,c,d,e,f)}function Nk(b,c,d,e,f){if(d){var g=c.$(),h=c.Va();void 0!==g&&h&&d!==g&&f&&0<f&&(b.Pa($f({resolution:g,duration:f,easing:Uf})),e&&b.Pa(Yf({source:h,duration:f,easing:Uf})));if(e){var k;b=c.Va();f=c.$();void 0!==b&&void 0!==f&&(k=[e[0]-d*(e[0]-b[0])/f,e[1]-d*(e[1]-b[1])/f]);c.mb(k)}c.Vb(d)}};function Ok(b){b=b?b:{};this.a=b.delta?b.delta:1;Kk.call(this,{handleEvent:Pk});this.c=void 0!==b.duration?b.duration:250}z(Ok,Kk);function Pk(b){var c=!1,d=b.a;if(b.type==Oj){var c=b.map,e=b.coordinate,d=d.c?-this.a:this.a,f=c.aa();Mk(c,f,d,e,this.c);b.preventDefault();c=!0}return!c};function Qk(b){b=b.a;return b.f&&!b.l&&b.c}function Rk(b){return"pointermove"==b.type}function Sk(b){return b.type==Pj}function Tk(b){b=b.a;return!b.f&&!b.l&&!b.c}function Uk(b){b=b.a;return!b.f&&!b.l&&b.c}function Vk(b){b=b.a.target.tagName;return"INPUT"!==b&&"SELECT"!==b&&"TEXTAREA"!==b}function Wk(b){return"mouse"==b.f.pointerType};function Xk(b){b=b?b:{};Kk.call(this,{handleEvent:b.handleEvent?b.handleEvent:Yk});this.Gc=b.handleDownEvent?b.handleDownEvent:re;this.$c=b.handleDragEvent?b.handleDragEvent:ya;this.Ze=b.handleMoveEvent?b.handleMoveEvent:ya;this.$e=b.handleUpEvent?b.handleUpEvent:re;this.C=!1;this.ha={};this.j=[]}z(Xk,Kk);function Zk(b){for(var c=b.length,d=0,e=0,f=0;f<c;f++)d+=b[f].clientX,e+=b[f].clientY;return[d/c,e/c]}
function Yk(b){if(!(b instanceof Kj))return!0;var c=!1,d=b.type;if(d===Tj||d===Vj||d===Rj)d=b.f,b.type==Rj?delete this.ha[d.pointerId]:b.type==Tj?this.ha[d.pointerId]=d:d.pointerId in this.ha&&(this.ha[d.pointerId]=d),this.j=Kb(this.ha);this.C&&(b.type==Vj?this.$c(b):b.type==Rj&&(this.C=this.$e(b)));b.type==Tj?(this.C=b=this.Gc(b),c=this.Ec(b)):b.type==Uj&&this.Ze(b);return!c}Xk.prototype.Ec=ue;function $k(b){Xk.call(this,{handleDownEvent:al,handleDragEvent:bl,handleUpEvent:cl});b=b?b:{};this.a=b.kinetic;this.c=this.l=null;this.v=b.condition?b.condition:Tk;this.o=!1}z($k,Xk);function bl(b){var c=Zk(this.j);this.a&&this.a.a.push(c[0],c[1],Date.now());if(this.c){var d=this.c[0]-c[0],e=c[1]-this.c[1];b=b.map;var f=b.aa(),g=Qf(f),e=d=[d,e],h=g.resolution;e[0]*=h;e[1]*=h;td(d,g.rotation);od(d,g.center);d=f.Yd(d);b.render();f.mb(d)}this.c=c}
function cl(b){b=b.map;var c=b.aa();if(0===this.j.length){var d;if(d=!this.o&&this.a)if(d=this.a,6>d.a.length)d=!1;else{var e=Date.now()-d.i,f=d.a.length-3;if(d.a[f+2]<e)d=!1;else{for(var g=f-3;0<g&&d.a[g+2]>e;)g-=3;var e=d.a[f+2]-d.a[g+2],h=d.a[f]-d.a[g],f=d.a[f+1]-d.a[g+1];d.g=Math.atan2(f,h);d.f=Math.sqrt(h*h+f*f)/e;d=d.f>d.b}}d&&(d=this.a,d=(d.b-d.f)/d.c,f=this.a.g,g=c.Va(),this.l=Jk(this.a,g),b.Pa(this.l),g=b.Ra(g),d=b.Ia([g[0]-d*Math.cos(f),g[1]-d*Math.sin(f)]),d=c.Yd(d),c.mb(d));Sf(c,-1);b.render();
return!1}this.c=null;return!0}function al(b){if(0<this.j.length&&this.v(b)){var c=b.map,d=c.aa();this.c=null;this.C||Sf(d,1);c.render();this.l&&gb(c.O,this.l)&&(d.mb(b.frameState.viewState.center),this.l=null);this.a&&(b=this.a,b.a.length=0,b.g=0,b.f=0);this.o=1<this.j.length;return!0}return!1}$k.prototype.Ec=re;function dl(b){b=b?b:{};Xk.call(this,{handleDownEvent:el,handleDragEvent:fl,handleUpEvent:gl});this.c=b.condition?b.condition:Qk;this.a=void 0;this.l=void 0!==b.duration?b.duration:250}z(dl,Xk);function fl(b){if(Wk(b)){var c=b.map,d=c.Ta();b=b.pixel;d=Math.atan2(d[1]/2-b[1],b[0]-d[0]/2);if(void 0!==this.a){b=d-this.a;var e=c.aa(),f=e.Ha();c.render();Lk(c,e,f-b)}this.a=d}}
function gl(b){if(!Wk(b))return!0;b=b.map;var c=b.aa();Sf(c,-1);var d=c.Ha(),e=this.l,d=c.constrainRotation(d,0);Lk(b,c,d,void 0,e);return!1}function el(b){return Wk(b)&&yc(b.a)&&this.c(b)?(b=b.map,Sf(b.aa(),1),b.render(),this.a=void 0,!0):!1}dl.prototype.Ec=re;function hl(b){this.c=null;this.f=document.createElement("div");this.f.style.position="absolute";this.f.className="ol-box "+b;this.b=this.g=this.a=null}z(hl,mc);hl.prototype.X=function(){this.setMap(null);hl.da.X.call(this)};function il(b){var c=b.g,d=b.b;b=b.f.style;b.left=Math.min(c[0],d[0])+"px";b.top=Math.min(c[1],d[1])+"px";b.width=Math.abs(d[0]-c[0])+"px";b.height=Math.abs(d[1]-c[1])+"px"}
hl.prototype.setMap=function(b){if(this.a){this.a.l.removeChild(this.f);var c=this.f.style;c.left=c.top=c.width=c.height="inherit"}(this.a=b)&&this.a.l.appendChild(this.f)};function jl(b){var c=b.g,d=b.b,c=[c,[c[0],d[1]],d,[d[0],c[1]]].map(b.a.Ia,b.a);c[4]=c[0].slice();b.c?b.c.ma([c]):b.c=new G([c])}hl.prototype.W=function(){return this.c};function kl(b,c,d){rc.call(this,b);this.coordinate=c;this.mapBrowserEvent=d}z(kl,rc);function ll(b){Xk.call(this,{handleDownEvent:ml,handleDragEvent:nl,handleUpEvent:pl});b=b?b:{};this.a=new hl(b.className||"ol-dragbox");this.c=null;this.D=b.condition?b.condition:se;this.v=b.boxEndCondition?b.boxEndCondition:ql}z(ll,Xk);function ql(b,c,d){b=d[0]-c[0];c=d[1]-c[1];return 64<=b*b+c*c}
function nl(b){if(Wk(b)){var c=this.a,d=b.pixel;c.g=this.c;c.b=d;jl(c);il(c);this.s(new kl("boxdrag",b.coordinate,b))}}ll.prototype.W=function(){return this.a.W()};ll.prototype.o=ya;function pl(b){if(!Wk(b))return!0;this.a.setMap(null);this.v(b,this.c,b.pixel)&&(this.o(b),this.s(new kl("boxend",b.coordinate,b)));return!1}
function ml(b){if(Wk(b)&&yc(b.a)&&this.D(b)){this.c=b.pixel;this.a.setMap(b.map);var c=this.a,d=this.c;c.g=this.c;c.b=d;jl(c);il(c);this.s(new kl("boxstart",b.coordinate,b));return!0}return!1};function rl(b){b=b?b:{};var c=b.condition?b.condition:Uk;this.l=void 0!==b.duration?b.duration:200;ll.call(this,{condition:c,className:b.className||"ol-dragzoom"})}z(rl,ll);rl.prototype.o=function(){var b=this.B,c=b.aa(),d=b.Ta(),e=this.W().J(),d=c.constrainResolution(Math.max(ie(e)/d[0],je(e)/d[1])),f=c.$(),g=c.Va();b.Pa($f({resolution:f,duration:this.l,easing:Uf}));b.Pa(Yf({source:g,duration:this.l,easing:Uf}));c.mb(ke(e));c.Vb(d)};function sl(b){Kk.call(this,{handleEvent:tl});b=b||{};this.a=void 0!==b.condition?b.condition:xe(Tk,Vk);this.c=void 0!==b.duration?b.duration:100;this.j=void 0!==b.pixelDelta?b.pixelDelta:128}z(sl,Kk);
function tl(b){var c=!1;if("key"==b.type){var d=b.a.i;if(this.a(b)&&(40==d||37==d||39==d||38==d)){var e=b.map,c=e.aa(),f=c.$()*this.j,g=0,h=0;40==d?h=-f:37==d?g=-f:39==d?g=f:h=f;d=[g,h];td(d,c.Ha());f=this.c;if(g=c.Va())f&&0<f&&e.Pa(Yf({source:g,duration:f,easing:Wf})),e=c.Yd([g[0]+d[0],g[1]+d[1]]),c.mb(e);b.preventDefault();c=!0}}return!c};function ul(b){Kk.call(this,{handleEvent:vl});b=b?b:{};this.c=b.condition?b.condition:Vk;this.a=b.delta?b.delta:1;this.j=void 0!==b.duration?b.duration:100}z(ul,Kk);function vl(b){var c=!1;if("key"==b.type){var d=b.a.G;if(this.c(b)&&(43==d||45==d)){c=b.map;d=43==d?this.a:-this.a;c.render();var e=c.aa();Mk(c,e,d,void 0,this.j);b.preventDefault();c=!0}}return!c};function wl(b){Kk.call(this,{handleEvent:xl});b=b||{};this.c=0;this.C=void 0!==b.duration?b.duration:250;this.o=void 0!==b.useAnchor?b.useAnchor:!0;this.a=null;this.l=this.j=void 0}z(wl,Kk);function xl(b){var c=!1;if("mousewheel"==b.type){var c=b.map,d=b.a;this.o&&(this.a=b.coordinate);this.c+=d.v;void 0===this.j&&(this.j=Date.now());d=Math.max(80-(Date.now()-this.j),0);ba.clearTimeout(this.l);this.l=ba.setTimeout(this.v.bind(this,c),d);b.preventDefault();c=!0}return!c}
wl.prototype.v=function(b){var c=Ra(this.c,-1,1),d=b.aa();b.render();Mk(b,d,-c,this.a,this.C);this.c=0;this.a=null;this.l=this.j=void 0};wl.prototype.D=function(b){this.o=b;b||(this.a=null)};function yl(b){Xk.call(this,{handleDownEvent:zl,handleDragEvent:Al,handleUpEvent:Bl});b=b||{};this.c=null;this.l=void 0;this.a=!1;this.o=0;this.D=void 0!==b.threshold?b.threshold:.3;this.v=void 0!==b.duration?b.duration:250}z(yl,Xk);
function Al(b){var c=0,d=this.j[0],e=this.j[1],d=Math.atan2(e.clientY-d.clientY,e.clientX-d.clientX);void 0!==this.l&&(c=d-this.l,this.o+=c,!this.a&&Math.abs(this.o)>this.D&&(this.a=!0));this.l=d;b=b.map;d=bh(b.a);e=Zk(this.j);e[0]-=d.x;e[1]-=d.y;this.c=b.Ia(e);this.a&&(d=b.aa(),e=d.Ha(),b.render(),Lk(b,d,e+c,this.c))}function Bl(b){if(2>this.j.length){b=b.map;var c=b.aa();Sf(c,-1);if(this.a){var d=c.Ha(),e=this.c,f=this.v,d=c.constrainRotation(d,0);Lk(b,c,d,e,f)}return!1}return!0}
function zl(b){return 2<=this.j.length?(b=b.map,this.c=null,this.l=void 0,this.a=!1,this.o=0,this.C||Sf(b.aa(),1),b.render(),!0):!1}yl.prototype.Ec=re;function Cl(b){Xk.call(this,{handleDownEvent:Dl,handleDragEvent:El,handleUpEvent:Fl});b=b?b:{};this.c=null;this.o=void 0!==b.duration?b.duration:400;this.a=void 0;this.l=1}z(Cl,Xk);function El(b){var c=1,d=this.j[0],e=this.j[1],f=d.clientX-e.clientX,d=d.clientY-e.clientY,f=Math.sqrt(f*f+d*d);void 0!==this.a&&(c=this.a/f);this.a=f;1!=c&&(this.l=c);b=b.map;var f=b.aa(),d=f.$(),e=bh(b.a),g=Zk(this.j);g[0]-=e.x;g[1]-=e.y;this.c=b.Ia(g);b.render();Nk(b,f,d*c,this.c)}
function Fl(b){if(2>this.j.length){b=b.map;var c=b.aa();Sf(c,-1);var d=c.$(),e=this.c,f=this.o,d=c.constrainResolution(d,0,this.l-1);Nk(b,c,d,e,f);return!1}return!0}function Dl(b){return 2<=this.j.length?(b=b.map,this.c=null,this.a=void 0,this.l=1,this.C||Sf(b.aa(),1),b.render(),!0):!1}Cl.prototype.Ec=re;function Gl(b){b=b?b:{};var c=new mg,d=new Ik(-.005,.05,100);(void 0!==b.altShiftDragRotate?b.altShiftDragRotate:1)&&c.push(new dl);(void 0!==b.doubleClickZoom?b.doubleClickZoom:1)&&c.push(new Ok({delta:b.zoomDelta,duration:b.zoomDuration}));(void 0!==b.dragPan?b.dragPan:1)&&c.push(new $k({kinetic:d}));(void 0!==b.pinchRotate?b.pinchRotate:1)&&c.push(new yl);(void 0!==b.pinchZoom?b.pinchZoom:1)&&c.push(new Cl({duration:b.zoomDuration}));if(void 0!==b.keyboard?b.keyboard:1)c.push(new sl),c.push(new ul({delta:b.zoomDelta,
duration:b.zoomDuration}));(void 0!==b.mouseWheelZoom?b.mouseWheelZoom:1)&&c.push(new wl({duration:b.zoomDuration}));(void 0!==b.shiftDragZoom?b.shiftDragZoom:1)&&c.push(new rl({duration:b.zoomDuration}));return c};function Hl(b){var c=b||{};b=Rb(c);delete b.layers;c=c.layers;Xj.call(this,b);this.b=[];this.a={};D(this,hd("layers"),this.Pk,!1,this);c?ia(c)&&(c=new mg(c.slice())):c=new mg;this.oh(c)}z(Hl,Xj);l=Hl.prototype;l.ke=function(){this.tb()&&this.u()};
l.Pk=function(){this.b.forEach(Wc);this.b.length=0;var b=this.Rc();this.b.push(D(b,"add",this.Ok,!1,this),D(b,"remove",this.Qk,!1,this));Hb(this.a,function(b){b.forEach(Wc)});Ob(this.a);var b=b.a,c,d,e;c=0;for(d=b.length;c<d;c++)e=b[c],this.a[w(e).toString()]=[D(e,"propertychange",this.ke,!1,this),D(e,"change",this.ke,!1,this)];this.u()};l.Ok=function(b){b=b.element;var c=w(b).toString();this.a[c]=[D(b,"propertychange",this.ke,!1,this),D(b,"change",this.ke,!1,this)];this.u()};
l.Qk=function(b){b=w(b.element).toString();this.a[b].forEach(Wc);delete this.a[b];this.u()};l.Rc=function(){return this.get("layers")};l.oh=function(b){this.set("layers",b)};
l.sf=function(b){var c=void 0!==b?b:[],d=c.length;this.Rc().forEach(function(b){b.sf(c)});b=Yj(this);var e,f;for(e=c.length;d<e;d++)f=c[d],f.opacity*=b.opacity,f.visible=f.visible&&b.visible,f.maxResolution=Math.min(f.maxResolution,b.maxResolution),f.minResolution=Math.max(f.minResolution,b.minResolution),void 0!==b.extent&&(f.extent=void 0!==f.extent?me(f.extent,b.extent):b.extent);return c};l.uf=function(){return"ready"};function Il(b){Be.call(this,{code:b,units:"m",extent:Jl,global:!0,worldExtent:Kl})}z(Il,Be);Il.prototype.getPointResolution=function(b,c){return b/Ta(c[1]/6378137)};var Ll=6378137*Math.PI,Jl=[-Ll,-Ll,Ll,Ll],Kl=[-180,-85,180,85],Oe="EPSG:3857 EPSG:102100 EPSG:102113 EPSG:900913 urn:ogc:def:crs:EPSG:6.18:3:3857 urn:ogc:def:crs:EPSG::3857 http://www.opengis.net/gml/srs/epsg.xml#3857".split(" ").map(function(b){return new Il(b)});
function Pe(b,c,d){var e=b.length;d=1<d?d:2;void 0===c&&(2<d?c=b.slice():c=Array(e));for(var f=0;f<e;f+=d)c[f]=6378137*Math.PI*b[f]/180,c[f+1]=6378137*Math.log(Math.tan(Math.PI*(b[f+1]+90)/360));return c}function Qe(b,c,d){var e=b.length;d=1<d?d:2;void 0===c&&(2<d?c=b.slice():c=Array(e));for(var f=0;f<e;f+=d)c[f]=180*b[f]/(6378137*Math.PI),c[f+1]=360*Math.atan(Math.exp(b[f+1]/6378137))/Math.PI-90;return c};var Ml=new ye(6378137);function Nl(b,c){Be.call(this,{code:b,units:"degrees",extent:Ol,axisOrientation:c,global:!0,metersPerUnit:Pl,worldExtent:Ol})}z(Nl,Be);Nl.prototype.getPointResolution=function(b){return b};
var Ol=[-180,-90,180,90],Pl=Math.PI*Ml.radius/180,Re=[new Nl("CRS:84"),new Nl("EPSG:4326","neu"),new Nl("urn:ogc:def:crs:EPSG::4326","neu"),new Nl("urn:ogc:def:crs:EPSG:6.6:4326","neu"),new Nl("urn:ogc:def:crs:OGC:1.3:CRS84"),new Nl("urn:ogc:def:crs:OGC:2:84"),new Nl("http://www.opengis.net/gml/srs/epsg.xml#4326","neu"),new Nl("urn:x-ogc:def:crs:EPSG:4326","neu")];function Ql(){Fe(Oe);Fe(Re);Ne()};function Rl(b){bk.call(this,b?b:{})}z(Rl,bk);function H(b){b=b?b:{};var c=Rb(b);delete c.preload;delete c.useInterimTilesOnError;bk.call(this,c);this.c(void 0!==b.preload?b.preload:0);this.g(void 0!==b.useInterimTilesOnError?b.useInterimTilesOnError:!0)}z(H,bk);H.prototype.a=function(){return this.get("preload")};H.prototype.c=function(b){this.set("preload",b)};H.prototype.b=function(){return this.get("useInterimTilesOnError")};H.prototype.g=function(b){this.set("useInterimTilesOnError",b)};var Sl=[0,0,0,1],Tl=[],Ul=[0,0,0,1];function Vl(b){b=b||{};this.a=void 0!==b.color?b.color:null;this.f=void 0}Vl.prototype.b=function(){return this.a};Vl.prototype.c=function(b){this.a=b;this.f=void 0};function Wl(b){void 0===b.f&&(b.f="f"+(b.a?tg(b.a):"-"));return b.f};function Xl(){this.f=-1};function Yl(){this.f=-1;this.f=64;this.a=Array(4);this.g=Array(this.f);this.c=this.b=0;this.reset()}z(Yl,Xl);Yl.prototype.reset=function(){this.a[0]=1732584193;this.a[1]=4023233417;this.a[2]=2562383102;this.a[3]=271733878;this.c=this.b=0};
function Zl(b,c,d){d||(d=0);var e=Array(16);if(la(c))for(var f=0;16>f;++f)e[f]=c.charCodeAt(d++)|c.charCodeAt(d++)<<8|c.charCodeAt(d++)<<16|c.charCodeAt(d++)<<24;else for(f=0;16>f;++f)e[f]=c[d++]|c[d++]<<8|c[d++]<<16|c[d++]<<24;c=b.a[0];d=b.a[1];var f=b.a[2],g=b.a[3],h=0,h=c+(g^d&(f^g))+e[0]+3614090360&4294967295;c=d+(h<<7&4294967295|h>>>25);h=g+(f^c&(d^f))+e[1]+3905402710&4294967295;g=c+(h<<12&4294967295|h>>>20);h=f+(d^g&(c^d))+e[2]+606105819&4294967295;f=g+(h<<17&4294967295|h>>>15);h=d+(c^f&(g^
c))+e[3]+3250441966&4294967295;d=f+(h<<22&4294967295|h>>>10);h=c+(g^d&(f^g))+e[4]+4118548399&4294967295;c=d+(h<<7&4294967295|h>>>25);h=g+(f^c&(d^f))+e[5]+1200080426&4294967295;g=c+(h<<12&4294967295|h>>>20);h=f+(d^g&(c^d))+e[6]+2821735955&4294967295;f=g+(h<<17&4294967295|h>>>15);h=d+(c^f&(g^c))+e[7]+4249261313&4294967295;d=f+(h<<22&4294967295|h>>>10);h=c+(g^d&(f^g))+e[8]+1770035416&4294967295;c=d+(h<<7&4294967295|h>>>25);h=g+(f^c&(d^f))+e[9]+2336552879&4294967295;g=c+(h<<12&4294967295|h>>>20);h=f+
(d^g&(c^d))+e[10]+4294925233&4294967295;f=g+(h<<17&4294967295|h>>>15);h=d+(c^f&(g^c))+e[11]+2304563134&4294967295;d=f+(h<<22&4294967295|h>>>10);h=c+(g^d&(f^g))+e[12]+1804603682&4294967295;c=d+(h<<7&4294967295|h>>>25);h=g+(f^c&(d^f))+e[13]+4254626195&4294967295;g=c+(h<<12&4294967295|h>>>20);h=f+(d^g&(c^d))+e[14]+2792965006&4294967295;f=g+(h<<17&4294967295|h>>>15);h=d+(c^f&(g^c))+e[15]+1236535329&4294967295;d=f+(h<<22&4294967295|h>>>10);h=c+(f^g&(d^f))+e[1]+4129170786&4294967295;c=d+(h<<5&4294967295|
h>>>27);h=g+(d^f&(c^d))+e[6]+3225465664&4294967295;g=c+(h<<9&4294967295|h>>>23);h=f+(c^d&(g^c))+e[11]+643717713&4294967295;f=g+(h<<14&4294967295|h>>>18);h=d+(g^c&(f^g))+e[0]+3921069994&4294967295;d=f+(h<<20&4294967295|h>>>12);h=c+(f^g&(d^f))+e[5]+3593408605&4294967295;c=d+(h<<5&4294967295|h>>>27);h=g+(d^f&(c^d))+e[10]+38016083&4294967295;g=c+(h<<9&4294967295|h>>>23);h=f+(c^d&(g^c))+e[15]+3634488961&4294967295;f=g+(h<<14&4294967295|h>>>18);h=d+(g^c&(f^g))+e[4]+3889429448&4294967295;d=f+(h<<20&4294967295|
h>>>12);h=c+(f^g&(d^f))+e[9]+568446438&4294967295;c=d+(h<<5&4294967295|h>>>27);h=g+(d^f&(c^d))+e[14]+3275163606&4294967295;g=c+(h<<9&4294967295|h>>>23);h=f+(c^d&(g^c))+e[3]+4107603335&4294967295;f=g+(h<<14&4294967295|h>>>18);h=d+(g^c&(f^g))+e[8]+1163531501&4294967295;d=f+(h<<20&4294967295|h>>>12);h=c+(f^g&(d^f))+e[13]+2850285829&4294967295;c=d+(h<<5&4294967295|h>>>27);h=g+(d^f&(c^d))+e[2]+4243563512&4294967295;g=c+(h<<9&4294967295|h>>>23);h=f+(c^d&(g^c))+e[7]+1735328473&4294967295;f=g+(h<<14&4294967295|
h>>>18);h=d+(g^c&(f^g))+e[12]+2368359562&4294967295;d=f+(h<<20&4294967295|h>>>12);h=c+(d^f^g)+e[5]+4294588738&4294967295;c=d+(h<<4&4294967295|h>>>28);h=g+(c^d^f)+e[8]+2272392833&4294967295;g=c+(h<<11&4294967295|h>>>21);h=f+(g^c^d)+e[11]+1839030562&4294967295;f=g+(h<<16&4294967295|h>>>16);h=d+(f^g^c)+e[14]+4259657740&4294967295;d=f+(h<<23&4294967295|h>>>9);h=c+(d^f^g)+e[1]+2763975236&4294967295;c=d+(h<<4&4294967295|h>>>28);h=g+(c^d^f)+e[4]+1272893353&4294967295;g=c+(h<<11&4294967295|h>>>21);h=f+(g^
c^d)+e[7]+4139469664&4294967295;f=g+(h<<16&4294967295|h>>>16);h=d+(f^g^c)+e[10]+3200236656&4294967295;d=f+(h<<23&4294967295|h>>>9);h=c+(d^f^g)+e[13]+681279174&4294967295;c=d+(h<<4&4294967295|h>>>28);h=g+(c^d^f)+e[0]+3936430074&4294967295;g=c+(h<<11&4294967295|h>>>21);h=f+(g^c^d)+e[3]+3572445317&4294967295;f=g+(h<<16&4294967295|h>>>16);h=d+(f^g^c)+e[6]+76029189&4294967295;d=f+(h<<23&4294967295|h>>>9);h=c+(d^f^g)+e[9]+3654602809&4294967295;c=d+(h<<4&4294967295|h>>>28);h=g+(c^d^f)+e[12]+3873151461&4294967295;
g=c+(h<<11&4294967295|h>>>21);h=f+(g^c^d)+e[15]+530742520&4294967295;f=g+(h<<16&4294967295|h>>>16);h=d+(f^g^c)+e[2]+3299628645&4294967295;d=f+(h<<23&4294967295|h>>>9);h=c+(f^(d|~g))+e[0]+4096336452&4294967295;c=d+(h<<6&4294967295|h>>>26);h=g+(d^(c|~f))+e[7]+1126891415&4294967295;g=c+(h<<10&4294967295|h>>>22);h=f+(c^(g|~d))+e[14]+2878612391&4294967295;f=g+(h<<15&4294967295|h>>>17);h=d+(g^(f|~c))+e[5]+4237533241&4294967295;d=f+(h<<21&4294967295|h>>>11);h=c+(f^(d|~g))+e[12]+1700485571&4294967295;c=d+
(h<<6&4294967295|h>>>26);h=g+(d^(c|~f))+e[3]+2399980690&4294967295;g=c+(h<<10&4294967295|h>>>22);h=f+(c^(g|~d))+e[10]+4293915773&4294967295;f=g+(h<<15&4294967295|h>>>17);h=d+(g^(f|~c))+e[1]+2240044497&4294967295;d=f+(h<<21&4294967295|h>>>11);h=c+(f^(d|~g))+e[8]+1873313359&4294967295;c=d+(h<<6&4294967295|h>>>26);h=g+(d^(c|~f))+e[15]+4264355552&4294967295;g=c+(h<<10&4294967295|h>>>22);h=f+(c^(g|~d))+e[6]+2734768916&4294967295;f=g+(h<<15&4294967295|h>>>17);h=d+(g^(f|~c))+e[13]+1309151649&4294967295;
d=f+(h<<21&4294967295|h>>>11);h=c+(f^(d|~g))+e[4]+4149444226&4294967295;c=d+(h<<6&4294967295|h>>>26);h=g+(d^(c|~f))+e[11]+3174756917&4294967295;g=c+(h<<10&4294967295|h>>>22);h=f+(c^(g|~d))+e[2]+718787259&4294967295;f=g+(h<<15&4294967295|h>>>17);h=d+(g^(f|~c))+e[9]+3951481745&4294967295;b.a[0]=b.a[0]+c&4294967295;b.a[1]=b.a[1]+(f+(h<<21&4294967295|h>>>11))&4294967295;b.a[2]=b.a[2]+f&4294967295;b.a[3]=b.a[3]+g&4294967295}
function $l(b,c){var d;ca(d)||(d=c.length);for(var e=d-b.f,f=b.g,g=b.b,h=0;h<d;){if(0==g)for(;h<=e;)Zl(b,c,h),h+=b.f;if(la(c))for(;h<d;){if(f[g++]=c.charCodeAt(h++),g==b.f){Zl(b,f);g=0;break}}else for(;h<d;)if(f[g++]=c[h++],g==b.f){Zl(b,f);g=0;break}}b.b=g;b.c+=d};function am(b){b=b||{};this.a=void 0!==b.color?b.color:null;this.c=b.lineCap;this.b=void 0!==b.lineDash?b.lineDash:null;this.g=b.lineJoin;this.i=b.miterLimit;this.f=b.width;this.j=void 0}l=am.prototype;l.yn=function(){return this.a};l.$j=function(){return this.c};l.zn=function(){return this.b};l.ak=function(){return this.g};l.fk=function(){return this.i};l.An=function(){return this.f};l.Bn=function(b){this.a=b;this.j=void 0};l.Wo=function(b){this.c=b;this.j=void 0};
l.Cn=function(b){this.b=b;this.j=void 0};l.Xo=function(b){this.g=b;this.j=void 0};l.Yo=function(b){this.i=b;this.j=void 0};l.bp=function(b){this.f=b;this.j=void 0};
function bm(b){if(void 0===b.j){var c="s"+(b.a?tg(b.a):"-")+","+(void 0!==b.c?b.c.toString():"-")+","+(b.b?b.b.toString():"-")+","+(void 0!==b.g?b.g:"-")+","+(void 0!==b.i?b.i.toString():"-")+","+(void 0!==b.f?b.f.toString():"-"),d=new Yl;$l(d,c);c=Array((56>d.b?d.f:2*d.f)-d.b);c[0]=128;for(var e=1;e<c.length-8;++e)c[e]=0;for(var f=8*d.c,e=c.length-8;e<c.length;++e)c[e]=f&255,f/=256;$l(d,c);c=Array(16);for(e=f=0;4>e;++e)for(var g=0;32>g;g+=8)c[f++]=d.a[e]>>>g&255;if(8192>=c.length)d=String.fromCharCode.apply(null,
c);else for(d="",e=0;e<c.length;e+=8192)f=lb(c,e,e+8192),d+=String.fromCharCode.apply(null,f);b.j=d}return b.j};function cm(b){b=b||{};this.i=this.a=this.g=null;this.c=void 0!==b.fill?b.fill:null;this.f=void 0!==b.stroke?b.stroke:null;this.b=b.radius;this.v=[0,0];this.o=this.O=this.l=null;var c=b.atlasManager,d,e=null,f,g=0;this.f&&(f=tg(this.f.a),g=this.f.f,void 0===g&&(g=1),e=this.f.b,Vi||(e=null));var h=2*(this.b+g)+1;f={strokeStyle:f,Jd:g,size:h,lineDash:e};if(void 0===c)this.a=document.createElement("CANVAS"),this.a.height=h,this.a.width=h,d=h=this.a.width,c=this.a.getContext("2d"),this.Bh(f,c,0,0),this.c?
this.i=this.a:(c=this.i=document.createElement("CANVAS"),c.height=f.size,c.width=f.size,c=c.getContext("2d"),this.Ah(f,c,0,0));else{h=Math.round(h);(e=!this.c)&&(d=this.Ah.bind(this,f));var g=this.f?bm(this.f):"-",k=this.c?Wl(this.c):"-";this.g&&g==this.g[1]&&k==this.g[2]&&this.b==this.g[3]||(this.g=["c"+g+k+(void 0!==this.b?this.b.toString():"-"),g,k,this.b]);f=dm(c,this.g[0],h,h,this.Bh.bind(this,f),d);this.a=f.image;this.v=[f.offsetX,f.offsetY];d=f.image.width;this.i=e?f.Tg:this.a}this.l=[h/2,
h/2];this.O=[h,h];this.o=[d,d];rk.call(this,{opacity:1,rotateWithView:!1,rotation:0,scale:1,snapToPixel:void 0!==b.snapToPixel?b.snapToPixel:!0})}z(cm,rk);l=cm.prototype;l.Yb=function(){return this.l};l.nn=function(){return this.c};l.Ce=function(){return this.i};l.hc=function(){return this.a};l.Ed=function(){return 2};l.td=function(){return this.o};l.Ea=function(){return this.v};l.pn=function(){return this.b};l.Eb=function(){return this.O};l.qn=function(){return this.f};l.yf=ya;l.load=ya;l.ag=ya;
l.Bh=function(b,c,d,e){c.setTransform(1,0,0,1,0,0);c.translate(d,e);c.beginPath();c.arc(b.size/2,b.size/2,this.b,0,2*Math.PI,!0);this.c&&(c.fillStyle=tg(this.c.a),c.fill());this.f&&(c.strokeStyle=b.strokeStyle,c.lineWidth=b.Jd,b.lineDash&&c.setLineDash(b.lineDash),c.stroke());c.closePath()};
l.Ah=function(b,c,d,e){c.setTransform(1,0,0,1,0,0);c.translate(d,e);c.beginPath();c.arc(b.size/2,b.size/2,this.b,0,2*Math.PI,!0);c.fillStyle=tg(Sl);c.fill();this.f&&(c.strokeStyle=b.strokeStyle,c.lineWidth=b.Jd,b.lineDash&&c.setLineDash(b.lineDash),c.stroke());c.closePath()};function em(b){b=b||{};this.i=null;this.c=fm;void 0!==b.geometry&&this.Eh(b.geometry);this.g=void 0!==b.fill?b.fill:null;this.f=void 0!==b.image?b.image:null;this.b=void 0!==b.stroke?b.stroke:null;this.j=void 0!==b.text?b.text:null;this.a=b.zIndex}l=em.prototype;l.W=function(){return this.i};l.Vj=function(){return this.c};l.Dn=function(){return this.g};l.En=function(){return this.f};l.Fn=function(){return this.b};l.Da=function(){return this.j};l.Gn=function(){return this.a};
l.Eh=function(b){na(b)?this.c=b:la(b)?this.c=function(c){return c.get(b)}:b?void 0!==b&&(this.c=function(){return b}):this.c=fm;this.i=b};l.Hn=function(b){this.a=b};function gm(b){if(!na(b)){var c;c=ia(b)?b:[b];b=function(){return c}}return b}var hm=null;function im(){if(!hm){var b=new Vl({color:"rgba(255,255,255,0.4)"}),c=new am({color:"#3399CC",width:1.25});hm=[new em({image:new cm({fill:b,stroke:c,radius:5}),fill:b,stroke:c})]}return hm}
function jm(){var b={},c=[255,255,255,1],d=[0,153,255,1];b.Polygon=[new em({fill:new Vl({color:[255,255,255,.5]})})];b.MultiPolygon=b.Polygon;b.LineString=[new em({stroke:new am({color:c,width:5})}),new em({stroke:new am({color:d,width:3})})];b.MultiLineString=b.LineString;b.Circle=b.Polygon.concat(b.LineString);b.Point=[new em({image:new cm({radius:6,fill:new Vl({color:d}),stroke:new am({color:c,width:1.5})}),zIndex:Infinity})];b.MultiPoint=b.Point;b.GeometryCollection=b.Polygon.concat(b.LineString,
b.Point);return b}function fm(b){return b.W()};function J(b){b=b?b:{};var c=Rb(b);delete c.style;delete c.renderBuffer;delete c.updateWhileAnimating;delete c.updateWhileInteracting;bk.call(this,c);this.a=void 0!==b.renderBuffer?b.renderBuffer:100;this.v=null;this.b=void 0;this.c(b.style);this.j=void 0!==b.updateWhileAnimating?b.updateWhileAnimating:!1;this.l=void 0!==b.updateWhileInteracting?b.updateWhileInteracting:!1}z(J,bk);function km(b){return b.get("renderOrder")}J.prototype.C=function(){return this.v};J.prototype.D=function(){return this.b};
J.prototype.c=function(b){this.v=void 0!==b?b:im;this.b=null===b?void 0:gm(this.v);this.u()};function L(b){b=b?b:{};var c=Rb(b);delete c.preload;delete c.useInterimTilesOnError;J.call(this,c);this.T(b.preload?b.preload:0);this.Y(b.useInterimTilesOnError?b.useInterimTilesOnError:!0)}z(L,J);L.prototype.g=function(){return this.get("preload")};L.prototype.U=function(){return this.get("useInterimTilesOnError")};L.prototype.T=function(b){this.set("preload",b)};L.prototype.Y=function(b){this.set("useInterimTilesOnError",b)};function lm(b,c,d,e,f){this.v={};this.b=b;this.D=c;this.g=d;this.pa=e;this.$c=f;this.i=this.a=this.f=this.ib=this.qa=this.ia=null;this.xa=this.na=this.B=this.T=this.U=this.wa=0;this.jb=!1;this.j=this.Fb=0;this.Gb=!1;this.Y=0;this.c="";this.o=this.O=this.Pd=this.oc=0;this.ha=this.G=this.l=null;this.C=[];this.Gc=Ad()}
function mm(b,c,d){if(b.i){c=af(c,0,d,2,b.pa,b.C);d=b.b;var e=b.Gc,f=d.globalAlpha;1!=b.B&&(d.globalAlpha=f*b.B);var g=b.Fb;b.jb&&(g+=b.$c);var h,k;h=0;for(k=c.length;h<k;h+=2){var m=c[h]-b.wa,n=c[h+1]-b.U;b.Gb&&(m=Math.round(m),n=Math.round(n));if(0!==g||1!=b.j){var p=m+b.wa,q=n+b.U;fk(e,p,q,b.j,b.j,g,-p,-q);d.setTransform(e[0],e[1],e[4],e[5],e[12],e[13])}d.drawImage(b.i,b.na,b.xa,b.Y,b.T,m,n,b.Y,b.T)}0===g&&1==b.j||d.setTransform(1,0,0,1,0,0);1!=b.B&&(d.globalAlpha=f)}}
function nm(b,c,d,e){var f=0;if(b.ha&&""!==b.c){b.l&&om(b,b.l);b.G&&pm(b,b.G);var g=b.ha,h=b.b,k=b.ib;k?(k.font!=g.font&&(k.font=h.font=g.font),k.textAlign!=g.textAlign&&(k.textAlign=h.textAlign=g.textAlign),k.textBaseline!=g.textBaseline&&(k.textBaseline=h.textBaseline=g.textBaseline)):(h.font=g.font,h.textAlign=g.textAlign,h.textBaseline=g.textBaseline,b.ib={font:g.font,textAlign:g.textAlign,textBaseline:g.textBaseline});c=af(c,f,d,e,b.pa,b.C);for(g=b.b;f<d;f+=e){h=c[f]+b.oc;k=c[f+1]+b.Pd;if(0!==
b.O||1!=b.o){var m=fk(b.Gc,h,k,b.o,b.o,b.O,-h,-k);g.setTransform(m[0],m[1],m[4],m[5],m[12],m[13])}b.G&&g.strokeText(b.c,h,k);b.l&&g.fillText(b.c,h,k)}0===b.O&&1==b.o||g.setTransform(1,0,0,1,0,0)}}function qm(b,c,d,e,f,g){var h=b.b;b=af(c,d,e,f,b.pa,b.C);h.moveTo(b[0],b[1]);for(c=2;c<b.length;c+=2)h.lineTo(b[c],b[c+1]);g&&h.lineTo(b[0],b[1]);return e}function rm(b,c,d,e,f){var g=b.b,h,k;h=0;for(k=e.length;h<k;++h)d=qm(b,c,d,e[h],f,!0),g.closePath();return d}l=lm.prototype;
l.pd=function(b,c){var d=b.toString(),e=this.v[d];void 0!==e?e.push(c):this.v[d]=[c]};l.Jc=function(b){if(ne(this.g,b.J())){if(this.f||this.a){this.f&&om(this,this.f);this.a&&pm(this,this.a);var c;c=this.pa;var d=this.C,e=b.ja();c=e?af(e,0,e.length,b.sa(),c,d):null;d=c[2]-c[0];e=c[3]-c[1];d=Math.sqrt(d*d+e*e);e=this.b;e.beginPath();e.arc(c[0],c[1],d,0,2*Math.PI);this.f&&e.fill();this.a&&e.stroke()}""!==this.c&&nm(this,b.yd(),2,2)}};
l.lf=function(b,c){var d=(0,c.c)(b);if(d&&ne(this.g,d.J())){var e=c.a;void 0===e&&(e=0);this.pd(e,function(b){b.eb(c.g,c.b);b.wb(c.f);b.fb(c.Da());sm[d.V()].call(b,d,null)})}};l.Zd=function(b,c){var d=b.c,e,f;e=0;for(f=d.length;e<f;++e){var g=d[e];sm[g.V()].call(this,g,c)}};l.Jb=function(b){var c=b.ja();b=b.sa();this.i&&mm(this,c,c.length);""!==this.c&&nm(this,c,c.length,b)};l.Ib=function(b){var c=b.ja();b=b.sa();this.i&&mm(this,c,c.length);""!==this.c&&nm(this,c,c.length,b)};
l.Xb=function(b){if(ne(this.g,b.J())){if(this.a){pm(this,this.a);var c=this.b,d=b.ja();c.beginPath();qm(this,d,0,d.length,b.sa(),!1);c.stroke()}""!==this.c&&(b=tm(b),nm(this,b,2,2))}};l.Kc=function(b){var c=b.J();if(ne(this.g,c)){if(this.a){pm(this,this.a);var c=this.b,d=b.ja(),e=0,f=b.Bb(),g=b.sa();c.beginPath();var h,k;h=0;for(k=f.length;h<k;++h)e=qm(this,d,e,f[h],g,!1);c.stroke()}""!==this.c&&(b=um(b),nm(this,b,b.length,2))}};
l.Mc=function(b){if(ne(this.g,b.J())){if(this.a||this.f){this.f&&om(this,this.f);this.a&&pm(this,this.a);var c=this.b;c.beginPath();rm(this,b.Rb(),0,b.Bb(),b.sa());this.f&&c.fill();this.a&&c.stroke()}""!==this.c&&(b=If(b),nm(this,b,2,2))}};
l.Lc=function(b){if(ne(this.g,b.J())){if(this.a||this.f){this.f&&om(this,this.f);this.a&&pm(this,this.a);var c=this.b,d=vm(b),e=0,f=b.g,g=b.sa(),h,k;h=0;for(k=f.length;h<k;++h){var m=f[h];c.beginPath();e=rm(this,d,e,m,g);this.f&&c.fill();this.a&&c.stroke()}}""!==this.c&&(b=xm(b),nm(this,b,b.length,2))}};function ym(b){var c=Object.keys(b.v).map(Number);c.sort(tb);var d,e,f,g,h;d=0;for(e=c.length;d<e;++d)for(f=b.v[c[d].toString()],g=0,h=f.length;g<h;++g)f[g](b)}
function om(b,c){var d=b.b,e=b.ia;e?e.fillStyle!=c.fillStyle&&(e.fillStyle=d.fillStyle=c.fillStyle):(d.fillStyle=c.fillStyle,b.ia={fillStyle:c.fillStyle})}
function pm(b,c){var d=b.b,e=b.qa;e?(e.lineCap!=c.lineCap&&(e.lineCap=d.lineCap=c.lineCap),Vi&&!qb(e.lineDash,c.lineDash)&&d.setLineDash(e.lineDash=c.lineDash),e.lineJoin!=c.lineJoin&&(e.lineJoin=d.lineJoin=c.lineJoin),e.lineWidth!=c.lineWidth&&(e.lineWidth=d.lineWidth=c.lineWidth),e.miterLimit!=c.miterLimit&&(e.miterLimit=d.miterLimit=c.miterLimit),e.strokeStyle!=c.strokeStyle&&(e.strokeStyle=d.strokeStyle=c.strokeStyle)):(d.lineCap=c.lineCap,Vi&&d.setLineDash(c.lineDash),d.lineJoin=c.lineJoin,d.lineWidth=
c.lineWidth,d.miterLimit=c.miterLimit,d.strokeStyle=c.strokeStyle,b.qa={lineCap:c.lineCap,lineDash:c.lineDash,lineJoin:c.lineJoin,lineWidth:c.lineWidth,miterLimit:c.miterLimit,strokeStyle:c.strokeStyle})}
l.eb=function(b,c){if(b){var d=b.a;this.f={fillStyle:tg(d?d:Sl)}}else this.f=null;if(c){var d=c.a,e=c.c,f=c.b,g=c.g,h=c.f,k=c.i;this.a={lineCap:void 0!==e?e:"round",lineDash:f?f:Tl,lineJoin:void 0!==g?g:"round",lineWidth:this.D*(void 0!==h?h:1),miterLimit:void 0!==k?k:10,strokeStyle:tg(d?d:Ul)}}else this.a=null};
l.wb=function(b){if(b){var c=b.Yb(),d=b.hc(1),e=b.Ea(),f=b.Eb();this.wa=c[0];this.U=c[1];this.T=f[1];this.i=d;this.B=b.B;this.na=e[0];this.xa=e[1];this.jb=b.C;this.Fb=b.G;this.j=b.j;this.Gb=b.D;this.Y=f[0]}else this.i=null};
l.fb=function(b){if(b){var c=b.a;c?(c=c.a,this.l={fillStyle:tg(c?c:Sl)}):this.l=null;var d=b.j;if(d){var c=d.a,e=d.c,f=d.b,g=d.g,h=d.f,d=d.i;this.G={lineCap:void 0!==e?e:"round",lineDash:f?f:Tl,lineJoin:void 0!==g?g:"round",lineWidth:void 0!==h?h:1,miterLimit:void 0!==d?d:10,strokeStyle:tg(c?c:Ul)}}else this.G=null;var c=b.b,e=b.c,f=b.g,g=b.i,h=b.f,d=b.Da(),k=b.l;b=b.o;this.ha={font:void 0!==c?c:"10px sans-serif",textAlign:void 0!==k?k:"center",textBaseline:void 0!==b?b:"middle"};this.c=void 0!==
d?d:"";this.oc=void 0!==e?this.D*e:0;this.Pd=void 0!==f?this.D*f:0;this.O=void 0!==g?g:0;this.o=this.D*(void 0!==h?h:1)}else this.c=""};var sm={Point:lm.prototype.Jb,LineString:lm.prototype.Xb,Polygon:lm.prototype.Mc,MultiPoint:lm.prototype.Ib,MultiLineString:lm.prototype.Kc,MultiPolygon:lm.prototype.Lc,GeometryCollection:lm.prototype.Zd,Circle:lm.prototype.Jc};function zm(b){ik.call(this,b);this.O=Ad()}z(zm,ik);
zm.prototype.G=function(b,c,d){Am(this,"precompose",d,b,void 0);var e=this.Bd();if(e){var f=c.extent,g=void 0!==f;if(g){var h=b.pixelRatio,k=fe(f),m=ee(f),n=de(f),f=ce(f);hk(b.coordinateToPixelMatrix,k,k);hk(b.coordinateToPixelMatrix,m,m);hk(b.coordinateToPixelMatrix,n,n);hk(b.coordinateToPixelMatrix,f,f);d.save();d.beginPath();d.moveTo(k[0]*h,k[1]*h);d.lineTo(m[0]*h,m[1]*h);d.lineTo(n[0]*h,n[1]*h);d.lineTo(f[0]*h,f[1]*h);d.clip()}h=this.qf();k=d.globalAlpha;d.globalAlpha=c.opacity;0===b.viewState.rotation?
d.drawImage(e,0,0,+e.width,+e.height,Math.round(h[12]),Math.round(h[13]),Math.round(e.width*h[0]),Math.round(e.height*h[5])):(d.setTransform(h[0],h[1],h[4],h[5],h[12],h[13]),d.drawImage(e,0,0),d.setTransform(1,0,0,1,0,0));d.globalAlpha=k;g&&d.restore()}Am(this,"postcompose",d,b,void 0)};function Am(b,c,d,e,f){var g=b.a;bd(g,c)&&(b=void 0!==f?f:Bm(b,e,0),b=new lm(d,e.pixelRatio,e.extent,b,e.viewState.rotation),g.s(new ak(c,g,b,e,d,null)),ym(b))}
function Bm(b,c,d){var e=c.viewState,f=c.pixelRatio;return fk(b.O,f*c.size[0]/2,f*c.size[1]/2,f/e.resolution,-f/e.resolution,-e.rotation,-e.center[0]+d,-e.center[1])}function Cm(b,c){var d=[0,0];hk(c,b,d);return d}
var Dm=function(){var b=null,c=null;return function(d){if(!b){b=Mi(1,1);c=b.createImageData(1,1);var e=c.data;e[0]=42;e[1]=84;e[2]=126;e[3]=255}var e=b.canvas,f=d[0]<=e.width&&d[1]<=e.height;f||(e.width=d[0],e.height=d[1],e=d[0]-1,d=d[1]-1,b.putImageData(c,e,d),d=b.getImageData(e,d,1,1),f=qb(c.data,d.data));return f}}();var Em=["Polygon","LineString","Image","Text"];function Fm(b,c,d){this.na=b;this.Y=c;this.c=null;this.g=0;this.resolution=d;this.U=this.wa=null;this.f=[];this.coordinates=[];this.ia=Ad();this.a=[];this.ha=[];this.qa=Ad();this.ib=Ad()}z(Fm,Zj);
function Gm(b,c,d,e,f,g){var h=b.coordinates.length,k=b.nf(),m=[c[d],c[d+1]],n=[NaN,NaN],p=!0,q,r,t;for(q=d+f;q<e;q+=f)n[0]=c[q],n[1]=c[q+1],t=Vd(k,n),t!==r?(p&&(b.coordinates[h++]=m[0],b.coordinates[h++]=m[1]),b.coordinates[h++]=n[0],b.coordinates[h++]=n[1],p=!1):1===t?(b.coordinates[h++]=n[0],b.coordinates[h++]=n[1],p=!1):p=!0,m[0]=n[0],m[1]=n[1],r=t;q===d+f&&(b.coordinates[h++]=m[0],b.coordinates[h++]=m[1]);g&&(b.coordinates[h++]=c[d],b.coordinates[h++]=c[d+1]);return h}
function Hm(b,c){b.wa=[0,c,0];b.f.push(b.wa);b.U=[0,c,0];b.a.push(b.U)}
function Im(b,c,d,e,f,g,h,k,m){var n;gk(e,b.ia)?n=b.ha:(n=af(b.coordinates,0,b.coordinates.length,2,e,b.ha),Dd(b.ia,e));e=!Nb(g);var p=0,q=h.length,r=0,t,v=b.qa;b=b.ib;for(var x,C,A,y;p<q;){var B=h[p],M,K,E,P;switch(B[0]){case 0:r=B[1];e&&g[w(r).toString()]||!r.W()?p=B[2]:void 0===m||ne(m,r.W().J())?++p:p=B[2];break;case 1:c.beginPath();++p;break;case 2:r=B[1];t=n[r];B=n[r+1];A=n[r+2]-t;r=n[r+3]-B;c.arc(t,B,Math.sqrt(A*A+r*r),0,2*Math.PI,!0);++p;break;case 3:c.closePath();++p;break;case 4:r=B[1];
t=B[2];M=B[3];E=B[4]*d;var fa=B[5]*d,I=B[6];K=B[7];var ga=B[8],Ja=B[9];A=B[11];y=B[12];var Sa=B[13],R=B[14];for(B[10]&&(A+=f);r<t;r+=2){B=n[r]-E;P=n[r+1]-fa;Sa&&(B=Math.round(B),P=Math.round(P));if(1!=y||0!==A){var ja=B+E,sc=P+fa;fk(v,ja,sc,y,y,A,-ja,-sc);c.transform(v[0],v[1],v[4],v[5],v[12],v[13])}ja=c.globalAlpha;1!=K&&(c.globalAlpha=ja*K);var sc=R+ga>M.width?M.width-ga:R,zc=I+Ja>M.height?M.height-Ja:I;c.drawImage(M,ga,Ja,sc,zc,B,P,sc*d,zc*d);1!=K&&(c.globalAlpha=ja);if(1!=y||0!==A)Gd(v,b),c.transform(b[0],
b[1],b[4],b[5],b[12],b[13])}++p;break;case 5:r=B[1];t=B[2];E=B[3];fa=B[4]*d;I=B[5]*d;A=B[6];y=B[7]*d;M=B[8];for(K=B[9];r<t;r+=2){B=n[r]+fa;P=n[r+1]+I;if(1!=y||0!==A)fk(v,B,P,y,y,A,-B,-P),c.transform(v[0],v[1],v[4],v[5],v[12],v[13]);ga=E.split("\n");Ja=ga.length;1<Ja?(Sa=Math.round(1.5*c.measureText("M").width),P-=(Ja-1)/2*Sa):Sa=0;for(R=0;R<Ja;R++)ja=ga[R],K&&c.strokeText(ja,B,P),M&&c.fillText(ja,B,P),P+=Sa;if(1!=y||0!==A)Gd(v,b),c.transform(b[0],b[1],b[4],b[5],b[12],b[13])}++p;break;case 6:if(void 0!==
k&&(r=B[1],r=k(r)))return r;++p;break;case 7:c.fill();++p;break;case 8:r=B[1];t=B[2];B=n[r];P=n[r+1];A=B+.5|0;y=P+.5|0;if(A!==x||y!==C)c.moveTo(B,P),x=A,C=y;for(r+=2;r<t;r+=2)if(B=n[r],P=n[r+1],A=B+.5|0,y=P+.5|0,A!==x||y!==C)c.lineTo(B,P),x=A,C=y;++p;break;case 9:c.fillStyle=B[1];++p;break;case 10:x=void 0!==B[7]?B[7]:!0;C=B[2];c.strokeStyle=B[1];c.lineWidth=x?C*d:C;c.lineCap=B[3];c.lineJoin=B[4];c.miterLimit=B[5];Vi&&c.setLineDash(B[6]);C=x=NaN;++p;break;case 11:c.font=B[1];c.textAlign=B[2];c.textBaseline=
B[3];++p;break;case 12:c.stroke();++p;break;default:++p}}}function Jm(b){var c=b.a;c.reverse();var d,e=c.length,f,g,h=-1;for(d=0;d<e;++d)if(f=c[d],g=f[0],6==g)h=d;else if(0==g){f[2]=d;f=b.a;for(g=d;h<g;){var k=f[h];f[h]=f[g];f[g]=k;++h;--g}h=-1}}function Km(b,c){b.wa[2]=b.f.length;b.wa=null;b.U[2]=b.a.length;b.U=null;var d=[6,c];b.f.push(d);b.a.push(d)}Fm.prototype.ye=ya;Fm.prototype.nf=function(){return this.Y};
function Lm(b,c,d){Fm.call(this,b,c,d);this.l=this.T=null;this.pa=this.O=this.D=this.C=this.v=this.B=this.G=this.o=this.j=this.i=this.b=void 0}z(Lm,Fm);Lm.prototype.Jb=function(b,c){if(this.l){Hm(this,c);var d=b.ja(),e=this.coordinates.length,d=Gm(this,d,0,d.length,b.sa(),!1);this.f.push([4,e,d,this.l,this.b,this.i,this.j,this.o,this.G,this.B,this.v,this.C,this.D,this.O,this.pa]);this.a.push([4,e,d,this.T,this.b,this.i,this.j,this.o,this.G,this.B,this.v,this.C,this.D,this.O,this.pa]);Km(this,c)}};
Lm.prototype.Ib=function(b,c){if(this.l){Hm(this,c);var d=b.ja(),e=this.coordinates.length,d=Gm(this,d,0,d.length,b.sa(),!1);this.f.push([4,e,d,this.l,this.b,this.i,this.j,this.o,this.G,this.B,this.v,this.C,this.D,this.O,this.pa]);this.a.push([4,e,d,this.T,this.b,this.i,this.j,this.o,this.G,this.B,this.v,this.C,this.D,this.O,this.pa]);Km(this,c)}};Lm.prototype.ye=function(){Jm(this);this.i=this.b=void 0;this.l=this.T=null;this.pa=this.O=this.C=this.v=this.B=this.G=this.o=this.D=this.j=void 0};
Lm.prototype.wb=function(b){var c=b.Yb(),d=b.Eb(),e=b.Ce(1),f=b.hc(1),g=b.Ea();this.b=c[0];this.i=c[1];this.T=e;this.l=f;this.j=d[1];this.o=b.B;this.G=g[0];this.B=g[1];this.v=b.C;this.C=b.G;this.D=b.j;this.O=b.D;this.pa=d[0]};function Mm(b,c,d){Fm.call(this,b,c,d);this.b={ld:void 0,fd:void 0,gd:null,hd:void 0,jd:void 0,kd:void 0,xf:0,strokeStyle:void 0,lineCap:void 0,lineDash:null,lineJoin:void 0,lineWidth:void 0,miterLimit:void 0}}z(Mm,Fm);
function Nm(b,c,d,e,f){var g=b.coordinates.length;c=Gm(b,c,d,e,f,!1);g=[8,g,c];b.f.push(g);b.a.push(g);return e}l=Mm.prototype;l.nf=function(){this.c||(this.c=Qd(this.Y),0<this.g&&Pd(this.c,this.resolution*(this.g+1)/2,this.c));return this.c};
function Om(b){var c=b.b,d=c.strokeStyle,e=c.lineCap,f=c.lineDash,g=c.lineJoin,h=c.lineWidth,k=c.miterLimit;c.ld==d&&c.fd==e&&qb(c.gd,f)&&c.hd==g&&c.jd==h&&c.kd==k||(c.xf!=b.coordinates.length&&(b.f.push([12]),c.xf=b.coordinates.length),b.f.push([10,d,h,e,g,k,f],[1]),c.ld=d,c.fd=e,c.gd=f,c.hd=g,c.jd=h,c.kd=k)}
l.Xb=function(b,c){var d=this.b,e=d.lineWidth;void 0!==d.strokeStyle&&void 0!==e&&(Om(this),Hm(this,c),this.a.push([10,d.strokeStyle,d.lineWidth,d.lineCap,d.lineJoin,d.miterLimit,d.lineDash],[1]),d=b.ja(),Nm(this,d,0,d.length,b.sa()),this.a.push([12]),Km(this,c))};
l.Kc=function(b,c){var d=this.b,e=d.lineWidth;if(void 0!==d.strokeStyle&&void 0!==e){Om(this);Hm(this,c);this.a.push([10,d.strokeStyle,d.lineWidth,d.lineCap,d.lineJoin,d.miterLimit,d.lineDash],[1]);var d=b.Bb(),e=b.ja(),f=b.sa(),g=0,h,k;h=0;for(k=d.length;h<k;++h)g=Nm(this,e,g,d[h],f);this.a.push([12]);Km(this,c)}};l.ye=function(){this.b.xf!=this.coordinates.length&&this.f.push([12]);Jm(this);this.b=null};
l.eb=function(b,c){var d=c.a;this.b.strokeStyle=tg(d?d:Ul);d=c.c;this.b.lineCap=void 0!==d?d:"round";d=c.b;this.b.lineDash=d?d:Tl;d=c.g;this.b.lineJoin=void 0!==d?d:"round";d=c.f;this.b.lineWidth=void 0!==d?d:1;d=c.i;this.b.miterLimit=void 0!==d?d:10;this.b.lineWidth>this.g&&(this.g=this.b.lineWidth,this.c=null)};
function Pm(b,c,d){Fm.call(this,b,c,d);this.b={ug:void 0,ld:void 0,fd:void 0,gd:null,hd:void 0,jd:void 0,kd:void 0,fillStyle:void 0,strokeStyle:void 0,lineCap:void 0,lineDash:null,lineJoin:void 0,lineWidth:void 0,miterLimit:void 0}}z(Pm,Fm);
function Qm(b,c,d,e,f){var g=b.b,h=[1];b.f.push(h);b.a.push(h);var k,h=0;for(k=e.length;h<k;++h){var m=e[h],n=b.coordinates.length;d=Gm(b,c,d,m,f,!0);d=[8,n,d];n=[3];b.f.push(d,n);b.a.push(d,n);d=m}c=[7];b.a.push(c);void 0!==g.fillStyle&&b.f.push(c);void 0!==g.strokeStyle&&(g=[12],b.f.push(g),b.a.push(g));return d}l=Pm.prototype;
l.Jc=function(b,c){var d=this.b,e=d.strokeStyle;if(void 0!==d.fillStyle||void 0!==e){Rm(this);Hm(this,c);this.a.push([9,tg(Sl)]);void 0!==d.strokeStyle&&this.a.push([10,d.strokeStyle,d.lineWidth,d.lineCap,d.lineJoin,d.miterLimit,d.lineDash]);var f=b.ja(),e=this.coordinates.length;Gm(this,f,0,f.length,b.sa(),!1);f=[1];e=[2,e];this.f.push(f,e);this.a.push(f,e);e=[7];this.a.push(e);void 0!==d.fillStyle&&this.f.push(e);void 0!==d.strokeStyle&&(d=[12],this.f.push(d),this.a.push(d));Km(this,c)}};
l.Mc=function(b,c){var d=this.b,e=d.strokeStyle;if(void 0!==d.fillStyle||void 0!==e)Rm(this),Hm(this,c),this.a.push([9,tg(Sl)]),void 0!==d.strokeStyle&&this.a.push([10,d.strokeStyle,d.lineWidth,d.lineCap,d.lineJoin,d.miterLimit,d.lineDash]),d=b.Bb(),e=b.Rb(),Qm(this,e,0,d,b.sa()),Km(this,c)};
l.Lc=function(b,c){var d=this.b,e=d.strokeStyle;if(void 0!==d.fillStyle||void 0!==e){Rm(this);Hm(this,c);this.a.push([9,tg(Sl)]);void 0!==d.strokeStyle&&this.a.push([10,d.strokeStyle,d.lineWidth,d.lineCap,d.lineJoin,d.miterLimit,d.lineDash]);var d=b.g,e=vm(b),f=b.sa(),g=0,h,k;h=0;for(k=d.length;h<k;++h)g=Qm(this,e,g,d[h],f);Km(this,c)}};l.ye=function(){Jm(this);this.b=null;var b=this.na;if(0!==b){var c=this.coordinates,d,e;d=0;for(e=c.length;d<e;++d)c[d]=b*Math.round(c[d]/b)}};
l.nf=function(){this.c||(this.c=Qd(this.Y),0<this.g&&Pd(this.c,this.resolution*(this.g+1)/2,this.c));return this.c};
l.eb=function(b,c){var d=this.b;if(b){var e=b.a;d.fillStyle=tg(e?e:Sl)}else d.fillStyle=void 0;c?(e=c.a,d.strokeStyle=tg(e?e:Ul),e=c.c,d.lineCap=void 0!==e?e:"round",e=c.b,d.lineDash=e?e.slice():Tl,e=c.g,d.lineJoin=void 0!==e?e:"round",e=c.f,d.lineWidth=void 0!==e?e:1,e=c.i,d.miterLimit=void 0!==e?e:10,d.lineWidth>this.g&&(this.g=d.lineWidth,this.c=null)):(d.strokeStyle=void 0,d.lineCap=void 0,d.lineDash=null,d.lineJoin=void 0,d.lineWidth=void 0,d.miterLimit=void 0)};
function Rm(b){var c=b.b,d=c.fillStyle,e=c.strokeStyle,f=c.lineCap,g=c.lineDash,h=c.lineJoin,k=c.lineWidth,m=c.miterLimit;void 0!==d&&c.ug!=d&&(b.f.push([9,d]),c.ug=c.fillStyle);void 0===e||c.ld==e&&c.fd==f&&c.gd==g&&c.hd==h&&c.jd==k&&c.kd==m||(b.f.push([10,e,k,f,h,m,g]),c.ld=e,c.fd=f,c.gd=g,c.hd=h,c.jd=k,c.kd=m)}function Sm(b,c,d){Fm.call(this,b,c,d);this.O=this.D=this.C=null;this.l="";this.v=this.B=this.G=this.o=0;this.j=this.i=this.b=null}z(Sm,Fm);
Sm.prototype.Kb=function(b,c,d,e,f,g){if(""!==this.l&&this.j&&(this.b||this.i)){if(this.b){f=this.b;var h=this.C;if(!h||h.fillStyle!=f.fillStyle){var k=[9,f.fillStyle];this.f.push(k);this.a.push(k);h?h.fillStyle=f.fillStyle:this.C={fillStyle:f.fillStyle}}}this.i&&(f=this.i,h=this.D,h&&h.lineCap==f.lineCap&&h.lineDash==f.lineDash&&h.lineJoin==f.lineJoin&&h.lineWidth==f.lineWidth&&h.miterLimit==f.miterLimit&&h.strokeStyle==f.strokeStyle||(k=[10,f.strokeStyle,f.lineWidth,f.lineCap,f.lineJoin,f.miterLimit,
f.lineDash,!1],this.f.push(k),this.a.push(k),h?(h.lineCap=f.lineCap,h.lineDash=f.lineDash,h.lineJoin=f.lineJoin,h.lineWidth=f.lineWidth,h.miterLimit=f.miterLimit,h.strokeStyle=f.strokeStyle):this.D={lineCap:f.lineCap,lineDash:f.lineDash,lineJoin:f.lineJoin,lineWidth:f.lineWidth,miterLimit:f.miterLimit,strokeStyle:f.strokeStyle}));f=this.j;h=this.O;h&&h.font==f.font&&h.textAlign==f.textAlign&&h.textBaseline==f.textBaseline||(k=[11,f.font,f.textAlign,f.textBaseline],this.f.push(k),this.a.push(k),h?
(h.font=f.font,h.textAlign=f.textAlign,h.textBaseline=f.textBaseline):this.O={font:f.font,textAlign:f.textAlign,textBaseline:f.textBaseline});Hm(this,g);f=this.coordinates.length;b=Gm(this,b,c,d,e,!1);b=[5,f,b,this.l,this.o,this.G,this.B,this.v,!!this.b,!!this.i];this.f.push(b);this.a.push(b);Km(this,g)}};
Sm.prototype.fb=function(b){if(b){var c=b.a;c?(c=c.a,c=tg(c?c:Sl),this.b?this.b.fillStyle=c:this.b={fillStyle:c}):this.b=null;var d=b.j;if(d){var c=d.a,e=d.c,f=d.b,g=d.g,h=d.f,d=d.i,e=void 0!==e?e:"round",f=f?f.slice():Tl,g=void 0!==g?g:"round",h=void 0!==h?h:1,d=void 0!==d?d:10,c=tg(c?c:Ul);if(this.i){var k=this.i;k.lineCap=e;k.lineDash=f;k.lineJoin=g;k.lineWidth=h;k.miterLimit=d;k.strokeStyle=c}else this.i={lineCap:e,lineDash:f,lineJoin:g,lineWidth:h,miterLimit:d,strokeStyle:c}}else this.i=null;
var m=b.b,c=b.c,e=b.g,f=b.i,h=b.f,d=b.Da(),g=b.l,k=b.o;b=void 0!==m?m:"10px sans-serif";g=void 0!==g?g:"center";k=void 0!==k?k:"middle";this.j?(m=this.j,m.font=b,m.textAlign=g,m.textBaseline=k):this.j={font:b,textAlign:g,textBaseline:k};this.l=void 0!==d?d:"";this.o=void 0!==c?c:0;this.G=void 0!==e?e:0;this.B=void 0!==f?f:0;this.v=void 0!==h?h:1}else this.l=""};function Tm(b,c,d,e){this.G=b;this.g=c;this.o=d;this.i=e;this.b={};this.j=Mi(1,1);this.l=Ad()}
function Um(b){for(var c in b.b){var d=b.b[c],e;for(e in d)d[e].ye()}}Tm.prototype.c=function(b,c,d,e,f){var g=this.l;fk(g,.5,.5,1/c,-1/c,-d,-b[0],-b[1]);var h=this.j;h.clearRect(0,0,1,1);var k;void 0!==this.i&&(k=Ld(),Md(k,b),Pd(k,c*this.i,k));return Vm(this,h,g,d,e,function(b){if(0<h.getImageData(0,0,1,1).data[3]){if(b=f(b))return b;h.clearRect(0,0,1,1)}},k)};
Tm.prototype.a=function(b,c){var d=void 0!==b?b.toString():"0",e=this.b[d];void 0===e&&(e={},this.b[d]=e);d=e[c];void 0===d&&(d=new Wm[c](this.G,this.g,this.o),e[c]=d);return d};Tm.prototype.Na=function(){return Nb(this.b)};
Tm.prototype.f=function(b,c,d,e,f,g){var h=Object.keys(this.b).map(Number);h.sort(tb);if(!1!==g){var k=this.g;g=k[0];var m=k[1],n=k[2],k=k[3];g=[g,m,g,k,n,k,n,m];af(g,0,8,2,d,g);b.save();b.beginPath();b.moveTo(g[0],g[1]);b.lineTo(g[2],g[3]);b.lineTo(g[4],g[5]);b.lineTo(g[6],g[7]);b.closePath();b.clip()}var p,q;g=0;for(m=h.length;g<m;++g)for(p=this.b[h[g].toString()],n=0,k=Em.length;n<k;++n)q=p[Em[n]],void 0!==q&&Im(q,b,c,d,e,f,q.f,void 0);b.restore()};
function Vm(b,c,d,e,f,g,h){var k=Object.keys(b.b).map(Number);k.sort(function(b,c){return c-b});var m,n,p,q,r;m=0;for(n=k.length;m<n;++m)for(q=b.b[k[m].toString()],p=Em.length-1;0<=p;--p)if(r=q[Em[p]],void 0!==r&&(r=Im(r,c,1,d,e,f,r.a,g,h)))return r}var Wm={Image:Lm,LineString:Mm,Polygon:Pm,Text:Sm};function Xm(b,c,d,e){this.b=b;this.a=c;this.g=d;this.c=e}l=Xm.prototype;l.get=function(b){return this.c[b]};l.Bb=function(){return this.g};l.J=function(){this.f||(this.f="Point"===this.b?Wd(this.a):Xd(this.a,0,this.a.length,2));return this.f};l.Rb=function(){return this.a};l.ja=Xm.prototype.Rb;l.W=function(){return this};l.Km=function(){return this.c};l.vd=Xm.prototype.W;l.sa=function(){return 2};l.cc=ya;l.V=function(){return this.b};function Ym(b,c){return w(b)-w(c)}function Zm(b,c){var d=.5*b/c;return d*d}function $m(b,c,d,e,f,g){var h=!1,k,m;if(k=d.f)m=k.Ed(),2==m||3==m?k.ag(f,g):(0==m&&k.load(),k.yf(f,g),h=!0);if(f=(0,d.c)(c))e=f.vd(e),(0,an[e.V()])(b,e,d,c);return h}
var an={Point:function(b,c,d,e){var f=d.f;if(f){if(2!=f.Ed())return;var g=b.a(d.a,"Image");g.wb(f);g.Jb(c,e)}if(f=d.Da())b=b.a(d.a,"Text"),b.fb(f),b.Kb(c.ja(),0,2,2,c,e)},LineString:function(b,c,d,e){var f=d.b;if(f){var g=b.a(d.a,"LineString");g.eb(null,f);g.Xb(c,e)}if(f=d.Da())b=b.a(d.a,"Text"),b.fb(f),b.Kb(tm(c),0,2,2,c,e)},Polygon:function(b,c,d,e){var f=d.g,g=d.b;if(f||g){var h=b.a(d.a,"Polygon");h.eb(f,g);h.Mc(c,e)}if(f=d.Da())b=b.a(d.a,"Text"),b.fb(f),b.Kb(If(c),0,2,2,c,e)},MultiPoint:function(b,
c,d,e){var f=d.f;if(f){if(2!=f.Ed())return;var g=b.a(d.a,"Image");g.wb(f);g.Ib(c,e)}if(f=d.Da())b=b.a(d.a,"Text"),b.fb(f),d=c.ja(),b.Kb(d,0,d.length,c.sa(),c,e)},MultiLineString:function(b,c,d,e){var f=d.b;if(f){var g=b.a(d.a,"LineString");g.eb(null,f);g.Kc(c,e)}if(f=d.Da())b=b.a(d.a,"Text"),b.fb(f),d=um(c),b.Kb(d,0,d.length,2,c,e)},MultiPolygon:function(b,c,d,e){var f=d.g,g=d.b;if(g||f){var h=b.a(d.a,"Polygon");h.eb(f,g);h.Lc(c,e)}if(f=d.Da())b=b.a(d.a,"Text"),b.fb(f),d=xm(c),b.Kb(d,0,d.length,2,
c,e)},GeometryCollection:function(b,c,d,e){c=c.c;var f,g;f=0;for(g=c.length;f<g;++f)(0,an[c[f].V()])(b,c[f],d,e)},Circle:function(b,c,d,e){var f=d.g,g=d.b;if(f||g){var h=b.a(d.a,"Polygon");h.eb(f,g);h.Jc(c,e)}if(f=d.Da())b=b.a(d.a,"Text"),b.fb(f),b.Kb(c.yd(),0,2,2,c,e)}};function bn(b,c,d,e,f,g){this.g=void 0!==g?g:null;dk.call(this,b,c,d,void 0!==g?0:2,e);this.c=f;this.f=null}z(bn,dk);bn.prototype.getError=function(){return this.f};bn.prototype.j=function(b){b?(this.f=b,this.state=3):this.state=2;ek(this)};bn.prototype.load=function(){0==this.state&&(this.state=1,ek(this),this.g(this.j.bind(this)))};bn.prototype.a=function(){return this.c};var cn=!((Gb("Chrome")||Gb("CriOS"))&&!Gb("Opera")&&!Gb("OPR")&&!Gb("Edge"))||Gb("iPhone")&&!Gb("iPod")&&!Gb("iPad")||Gb("iPad")||Gb("iPod");function dn(b,c,d,e){var f=Ye(d,c,b);d=c.getPointResolution(e,d);c=c.$b();void 0!==c&&(d*=c);c=b.$b();void 0!==c&&(d/=c);b=b.getPointResolution(d,f)/d;isFinite(b)&&!isNaN(b)&&0<b&&(d/=b);return d}function en(b,c,d,e){b=d-b;c=e-c;var f=Math.sqrt(b*b+c*c);return[Math.round(d+b/f),Math.round(e+c/f)]}
function fn(b,c,d,e,f,g,h,k,m,n){var p=Mi(Math.round(d*b),Math.round(d*c));if(0===m.length)return p.canvas;p.scale(d,d);var q=Ld();m.forEach(function(b){ae(q,b.extent)});var r=Mi(Math.round(d*ie(q)/e),Math.round(d*je(q)/e));r.scale(d/e,d/e);r.translate(-q[0],q[3]);m.forEach(function(b){r.drawImage(b.image,b.extent[0],-b.extent[3],ie(b.extent),je(b.extent))});var t=fe(h);k.c.forEach(function(b){var c=b.source,f=b.target,h=c[1][0],k=c[1][1],m=c[2][0],n=c[2][1];b=(f[0][0]-t[0])/g;var K=-(f[0][1]-t[1])/
g,E=(f[1][0]-t[0])/g,P=-(f[1][1]-t[1])/g,fa=(f[2][0]-t[0])/g,I=-(f[2][1]-t[1])/g,f=c[0][0],c=c[0][1],h=h-f,k=k-c,m=m-f,n=n-c;a:{h=[[h,k,0,0,E-b],[m,n,0,0,fa-b],[0,0,h,k,P-K],[0,0,m,n,I-K]];k=h.length;for(m=0;m<k;m++){for(var n=m,ga=Math.abs(h[m][m]),Ja=m+1;Ja<k;Ja++){var Sa=Math.abs(h[Ja][m]);Sa>ga&&(ga=Sa,n=Ja)}if(0===ga){h=null;break a}ga=h[n];h[n]=h[m];h[m]=ga;for(n=m+1;n<k;n++)for(ga=-h[n][m]/h[m][m],Ja=m;Ja<k+1;Ja++)h[n][Ja]=m==Ja?0:h[n][Ja]+ga*h[m][Ja]}m=Array(k);for(n=k-1;0<=n;n--)for(m[n]=
h[n][k]/h[n][n],ga=n-1;0<=ga;ga--)h[ga][k]-=h[ga][n]*m[n];h=m}h&&(p.save(),p.beginPath(),cn?(m=(b+E+fa)/3,n=(K+P+I)/3,k=en(m,n,b,K),E=en(m,n,E,P),fa=en(m,n,fa,I),p.moveTo(k[0],k[1]),p.lineTo(E[0],E[1]),p.lineTo(fa[0],fa[1])):(p.moveTo(b,K),p.lineTo(E,P),p.lineTo(fa,I)),p.closePath(),p.clip(),p.transform(h[0],h[2],h[1],h[3],b,K),p.translate(q[0]-f,q[3]-c),p.scale(e/d,-e/d),p.drawImage(r.canvas,0,0),p.restore())});n&&(p.save(),p.strokeStyle="black",p.lineWidth=1,k.c.forEach(function(b){var c=b.target;
b=(c[0][0]-t[0])/g;var d=-(c[0][1]-t[1])/g,e=(c[1][0]-t[0])/g,f=-(c[1][1]-t[1])/g,h=(c[2][0]-t[0])/g,c=-(c[2][1]-t[1])/g;p.beginPath();p.moveTo(b,d);p.lineTo(e,f);p.lineTo(h,c);p.closePath();p.stroke()}),p.restore());return p.canvas};function gn(b,c,d,e,f){this.b=b;this.g=c;var g={},h=We(this.g,this.b);this.f=function(b){var c=b[0]+"/"+b[1];g[c]||(g[c]=h(b));return g[c]};this.i=e;this.G=f*f;this.c=[];this.l=!1;this.o=this.b.f&&!!e&&!!this.b.J()&&ie(e)==ie(this.b.J());this.a=this.b.J()?ie(this.b.J()):null;this.j=this.g.J()?ie(this.g.J()):null;b=fe(d);c=ee(d);e=de(d);d=ce(d);f=this.f(b);var k=this.f(c),m=this.f(e),n=this.f(d);hn(this,b,c,e,d,f,k,m,n,10);if(this.l){var p=Infinity;this.c.forEach(function(b){p=Math.min(p,b.source[0][0],
b.source[1][0],b.source[2][0])});this.c.forEach(function(b){if(Math.max(b.source[0][0],b.source[1][0],b.source[2][0])-p>this.a/2){var c=[[b.source[0][0],b.source[0][1]],[b.source[1][0],b.source[1][1]],[b.source[2][0],b.source[2][1]]];c[0][0]-p>this.a/2&&(c[0][0]-=this.a);c[1][0]-p>this.a/2&&(c[1][0]-=this.a);c[2][0]-p>this.a/2&&(c[2][0]-=this.a);Math.max(c[0][0],c[1][0],c[2][0])-Math.min(c[0][0],c[1][0],c[2][0])<this.a/2&&(b.source=c)}},this)}g={}}
function hn(b,c,d,e,f,g,h,k,m,n){var p=Kd([g,h,k,m]),q=b.a?ie(p)/b.a:null,r=b.b.f&&.5<q&&1>q,t=!1;if(0<n){if(b.g.b&&b.j)var v=Kd([c,d,e,f]),t=t|.25<ie(v)/b.j;!r&&b.b.b&&q&&(t|=.25<q)}if(t||!b.i||ne(p,b.i)){if(!(t||isFinite(g[0])&&isFinite(g[1])&&isFinite(h[0])&&isFinite(h[1])&&isFinite(k[0])&&isFinite(k[1])&&isFinite(m[0])&&isFinite(m[1])))if(0<n)t=!0;else return;if(0<n&&(t||(q=b.f([(c[0]+e[0])/2,(c[1]+e[1])/2]),p=r?(md(g[0],b.a)+md(k[0],b.a))/2-md(q[0],b.a):(g[0]+k[0])/2-q[0],q=(g[1]+k[1])/2-q[1],
t=p*p+q*q>b.G),t)){Math.abs(c[0]-e[0])<=Math.abs(c[1]-e[1])?(r=[(d[0]+e[0])/2,(d[1]+e[1])/2],p=b.f(r),q=[(f[0]+c[0])/2,(f[1]+c[1])/2],t=b.f(q),hn(b,c,d,r,q,g,h,p,t,n-1),hn(b,q,r,e,f,t,p,k,m,n-1)):(r=[(c[0]+d[0])/2,(c[1]+d[1])/2],p=b.f(r),q=[(e[0]+f[0])/2,(e[1]+f[1])/2],t=b.f(q),hn(b,c,r,q,f,g,p,t,m,n-1),hn(b,r,d,e,q,p,h,k,t,n-1));return}if(r){if(!b.o)return;b.l=!0}b.c.push({source:[g,k,m],target:[c,e,f]});b.c.push({source:[g,h,k],target:[c,d,e]})}}
function jn(b){var c=Ld();b.c.forEach(function(b){b=b.source;Md(c,b[0]);Md(c,b[1]);Md(c,b[2])});return c};function kn(b,c,d,e,f,g){this.v=c;this.B=b.J();var h=c.J(),k=h?me(d,h):d,h=dn(b,c,ke(k),e);this.o=new gn(b,c,k,this.B,.5*h);this.j=e;this.g=d;b=jn(this.o);this.G=(this.f=g(b,h,f))?this.f.b:1;this.c=this.l=null;f=2;g=[];this.f&&(f=0,g=this.f.i);dk.call(this,d,e,this.G,f,g)}z(kn,dk);kn.prototype.X=function(){1==this.state&&(Wc(this.c),this.c=null);kn.da.X.call(this)};kn.prototype.a=function(){return this.l};
function ln(b){var c=b.f.state;2==c&&(b.l=fn(ie(b.g)/b.j,je(b.g)/b.j,b.G,b.f.$(),0,b.j,b.g,b.o,[{extent:b.f.J(),image:b.f.a()}]));b.state=c;ek(b)}kn.prototype.load=function(){if(0==this.state){this.state=1;ek(this);var b=this.f.state;2==b||3==b?ln(this):(this.c=this.f.Sa("change",function(){var b=this.f.state;if(2==b||3==b)Wc(this.c),this.c=null,ln(this)},!1,this),this.f.load())}};function mn(b){uh.call(this,{attributions:b.attributions,extent:b.extent,logo:b.logo,projection:b.projection,state:b.state});this.D=void 0!==b.resolutions?b.resolutions:null;this.a=null;this.qa=0}z(mn,uh);function nn(b,c){if(b.D){var d=vb(b.D,c,0);c=b.D[d]}return c}
mn.prototype.C=function(b,c,d,e){var f=this.b;if(f&&e&&!Ve(f,e)){if(this.a){if(this.qa==this.f&&Ve(this.a.v,e)&&this.a.$()==c&&this.a.b==d&&$d(this.a.J(),b))return this.a;this.a.rc();this.a=null}this.a=new kn(f,e,b,c,d,function(b,c,d){return this.sd(b,c,d,f)}.bind(this));this.qa=this.f;return this.a}f&&(e=f);return this.sd(b,c,d,e)};mn.prototype.l=function(b){b=b.target;switch(b.state){case 1:this.s(new on(pn,b));break;case 2:this.s(new on(qn,b));break;case 3:this.s(new on(rn,b))}};
function sn(b,c){b.a().src=c}function on(b,c){rc.call(this,b);this.image=c}z(on,rc);var pn="imageloadstart",qn="imageloadend",rn="imageloaderror";function tn(b){mn.call(this,{attributions:b.attributions,logo:b.logo,projection:b.projection,resolutions:b.resolutions,state:void 0!==b.state?b.state:void 0});this.ia=b.canvasFunction;this.Y=null;this.ha=0;this.na=void 0!==b.ratio?b.ratio:1.5}z(tn,mn);tn.prototype.sd=function(b,c,d,e){c=nn(this,c);var f=this.Y;if(f&&this.ha==this.f&&f.$()==c&&f.b==d&&Ud(f.J(),b))return f;b=b.slice();oe(b,this.na);(e=this.ia(b,c,d,[ie(b)/c*d,je(b)/c*d],e))&&(f=new bn(b,c,d,this.i,e));this.Y=f;this.ha=this.f;return f};function un(b){fd.call(this);this.ya=void 0;this.a="geometry";this.c=null;this.g=void 0;this.b=null;D(this,hd(this.a),this.je,!1,this);void 0!==b&&(b instanceof $e||!b?this.Oa(b):this.I(b))}z(un,fd);l=un.prototype;l.clone=function(){var b=new un(this.R());b.Cc(this.a);var c=this.W();c&&b.Oa(c.clone());(c=this.c)&&b.Bf(c);return b};l.W=function(){return this.get(this.a)};l.Qa=function(){return this.ya};l.Wj=function(){return this.a};l.Hl=function(){return this.c};l.cc=function(){return this.g};
l.Il=function(){this.u()};l.je=function(){this.b&&(Wc(this.b),this.b=null);var b=this.W();b&&(this.b=D(b,"change",this.Il,!1,this));this.u()};l.Oa=function(b){this.set(this.a,b)};l.Bf=function(b){this.g=(this.c=b)?vn(b):void 0;this.u()};l.kc=function(b){this.ya=b;this.u()};l.Cc=function(b){Vc(this,hd(this.a),this.je,!1,this);this.a=b;D(this,hd(this.a),this.je,!1,this);this.je()};function vn(b){if(!na(b)){var c;c=ia(b)?b:[b];b=function(){return c}}return b};function wn(b){b.prototype.then=b.prototype.then;b.prototype.$goog_Thenable=!0}function xn(b){if(!b)return!1;try{return!!b.$goog_Thenable}catch(c){return!1}};function yn(b,c,d){this.c=d;this.b=b;this.g=c;this.f=0;this.a=null}yn.prototype.get=function(){var b;0<this.f?(this.f--,b=this.a,this.a=b.next,b.next=null):b=this.b();return b};function zn(b,c){b.g(c);b.f<b.c&&(b.f++,c.next=b.a,b.a=c)};function An(){this.f=this.a=null}var Cn=new yn(function(){return new Bn},function(b){b.reset()},100);An.prototype.remove=function(){var b=null;this.a&&(b=this.a,this.a=this.a.next,this.a||(this.f=null),b.next=null);return b};function Bn(){this.next=this.f=this.a=null}Bn.prototype.set=function(b,c){this.a=b;this.f=c;this.next=null};Bn.prototype.reset=function(){this.next=this.f=this.a=null};function Dn(b,c){En||Fn();Gn||(En(),Gn=!0);var d=Hn,e=Cn.get();e.set(b,c);d.f?d.f.next=e:d.a=e;d.f=e}var En;function Fn(){if(ba.Promise&&ba.Promise.resolve){var b=ba.Promise.resolve(void 0);En=function(){b.then(In)}}else En=function(){ki(In)}}var Gn=!1,Hn=new An;function In(){for(var b=null;b=Hn.remove();){try{b.a.call(b.f)}catch(c){ji(c)}zn(Cn,b)}Gn=!1};function Jn(b,c){this.a=Kn;this.j=void 0;this.c=this.f=this.b=null;this.g=this.i=!1;if(b!=da)try{var d=this;b.call(c,function(b){Ln(d,Mn,b)},function(b){Ln(d,Nn,b)})}catch(e){Ln(this,Nn,e)}}var Kn=0,Mn=2,Nn=3;function On(){this.next=this.b=this.f=this.c=this.a=null;this.g=!1}On.prototype.reset=function(){this.b=this.f=this.c=this.a=null;this.g=!1};var Pn=new yn(function(){return new On},function(b){b.reset()},100);function Qn(b,c,d){var e=Pn.get();e.c=b;e.f=c;e.b=d;return e}
Jn.prototype.then=function(b,c,d){return Rn(this,na(b)?b:null,na(c)?c:null,d)};wn(Jn);Jn.prototype.cancel=function(b){this.a==Kn&&Dn(function(){var c=new Sn(b);Tn(this,c)},this)};function Tn(b,c){if(b.a==Kn)if(b.b){var d=b.b;if(d.f){for(var e=0,f=null,g=null,h=d.f;h&&(h.g||(e++,h.a==b&&(f=h),!(f&&1<e)));h=h.next)f||(g=h);f&&(d.a==Kn&&1==e?Tn(d,c):(g?(e=g,e.next==d.c&&(d.c=e),e.next=e.next.next):Un(d),Vn(d,f,Nn,c)))}b.b=null}else Ln(b,Nn,c)}
function Wn(b,c){b.f||b.a!=Mn&&b.a!=Nn||Xn(b);b.c?b.c.next=c:b.f=c;b.c=c}function Rn(b,c,d,e){var f=Qn(null,null,null);f.a=new Jn(function(b,h){f.c=c?function(d){try{var f=c.call(e,d);b(f)}catch(n){h(n)}}:b;f.f=d?function(c){try{var f=d.call(e,c);!ca(f)&&c instanceof Sn?h(c):b(f)}catch(n){h(n)}}:h});f.a.b=b;Wn(b,f);return f.a}Jn.prototype.o=function(b){this.a=Kn;Ln(this,Mn,b)};Jn.prototype.G=function(b){this.a=Kn;Ln(this,Nn,b)};
function Ln(b,c,d){if(b.a==Kn){b==d&&(c=Nn,d=new TypeError("Promise cannot resolve to itself"));b.a=1;var e;a:{var f=d,g=b.o,h=b.G;if(f instanceof Jn)Wn(f,Qn(g||da,h||null,b)),e=!0;else if(xn(f))f.then(g,h,b),e=!0;else{if(oa(f))try{var k=f.then;if(na(k)){Yn(f,k,g,h,b);e=!0;break a}}catch(m){h.call(b,m);e=!0;break a}e=!1}}e||(b.j=d,b.a=c,b.b=null,Xn(b),c!=Nn||d instanceof Sn||Zn(b,d))}}
function Yn(b,c,d,e,f){function g(b){k||(k=!0,e.call(f,b))}function h(b){k||(k=!0,d.call(f,b))}var k=!1;try{c.call(b,h,g)}catch(m){g(m)}}function Xn(b){b.i||(b.i=!0,Dn(b.l,b))}function Un(b){var c=null;b.f&&(c=b.f,b.f=c.next,c.next=null);b.f||(b.c=null);return c}Jn.prototype.l=function(){for(var b=null;b=Un(this);)Vn(this,b,this.a,this.j);this.i=!1};
function Vn(b,c,d,e){if(d==Nn&&c.f&&!c.g)for(;b&&b.g;b=b.b)b.g=!1;if(c.a)c.a.b=null,$n(c,d,e);else try{c.g?c.c.call(c.b):$n(c,d,e)}catch(f){ao.call(null,f)}zn(Pn,c)}function $n(b,c,d){c==Mn?b.c.call(b.b,d):b.f&&b.f.call(b.b,d)}function Zn(b,c){b.g=!0;Dn(function(){b.g&&ao.call(null,c)})}var ao=ji;function Sn(b){za.call(this,b)}z(Sn,za);Sn.prototype.name="cancel";function bo(b,c,d){if(na(b))d&&(b=ta(b,d));else if(b&&"function"==typeof b.handleEvent)b=ta(b.handleEvent,b);else throw Error("Invalid listener argument");return 2147483647<c?-1:ba.setTimeout(b,c||0)};var co=ba.JSON.parse,eo=ba.JSON.stringify;function fo(){}fo.prototype.f=null;function go(b){return b.f||(b.f=b.c())};var ho;function io(){}z(io,fo);io.prototype.a=function(){var b=jo(this);return b?new ActiveXObject(b):new XMLHttpRequest};io.prototype.c=function(){var b={};jo(this)&&(b[0]=!0,b[1]=!0);return b};
function jo(b){if(!b.b&&"undefined"==typeof XMLHttpRequest&&"undefined"!=typeof ActiveXObject){for(var c=["MSXML2.XMLHTTP.6.0","MSXML2.XMLHTTP.3.0","MSXML2.XMLHTTP","Microsoft.XMLHTTP"],d=0;d<c.length;d++){var e=c[d];try{return new ActiveXObject(e),b.b=e}catch(f){}}throw Error("Could not create ActiveXObject. ActiveX might be disabled, or MSXML might not be installed");}return b.b}ho=new io;var ko=/^(?:([^:/?#.]+):)?(?:\/\/(?:([^/?#]*)@)?([^/#?]*?)(?::([0-9]+))?(?=[/#?]|$))?([^?#]+)?(?:\?([^#]*))?(?:#(.*))?$/;function lo(b,c){if(b)for(var d=b.split("&"),e=0;e<d.length;e++){var f=d[e].indexOf("="),g=null,h=null;0<=f?(g=d[e].substring(0,f),h=d[e].substring(f+1)):g=d[e];c(g,h?decodeURIComponent(h.replace(/\+/g," ")):"")}}
function mo(b){if(b[1]){var c=b[0],d=c.indexOf("#");0<=d&&(b.push(c.substr(d)),b[0]=c=c.substr(0,d));d=c.indexOf("?");0>d?b[1]="?":d==c.length-1&&(b[1]=void 0)}return b.join("")}function no(b,c,d){if(ia(c))for(var e=0;e<c.length;e++)no(b,String(c[e]),d);else null!=c&&d.push("&",b,""===c?"":"=",encodeURIComponent(String(c)))}function oo(b,c){for(var d in c)no(d,c[d],b);return b};function po(b){$c.call(this);this.O=new oi;this.o=b||null;this.a=!1;this.l=this.fa=null;this.g=this.U=this.v="";this.f=this.B=this.c=this.G=!1;this.j=0;this.b=null;this.i=qo;this.C=this.Y=!1}z(po,$c);var qo="",ro=/^https?$/i,so=["POST","PUT"];
function to(b,c){if(b.fa)throw Error("[goog.net.XhrIo] Object is active with another request="+b.v+"; newUri="+c);b.v=c;b.g="";b.U="GET";b.G=!1;b.a=!0;b.fa=b.o?b.o.a():ho.a();b.l=b.o?go(b.o):go(ho);b.fa.onreadystatechange=ta(b.D,b);try{b.B=!0,b.fa.open("GET",String(c),!0),b.B=!1}catch(g){uo(b,g);return}var d=b.O.clone(),e=eb(d.P(),vo),f=ba.FormData&&!1;!(0<=$a(so,"GET"))||e||f||d.set("Content-Type","application/x-www-form-urlencoded;charset=utf-8");d.forEach(function(b,c){this.fa.setRequestHeader(c,
b)},b);b.i&&(b.fa.responseType=b.i);"withCredentials"in b.fa&&(b.fa.withCredentials=b.Y);try{wo(b),0<b.j&&(b.C=xo(b.fa),b.C?(b.fa.timeout=b.j,b.fa.ontimeout=ta(b.Fc,b)):b.b=bo(b.Fc,b.j,b)),b.c=!0,b.fa.send(""),b.c=!1}catch(g){uo(b,g)}}function xo(b){return Wb&&gc(9)&&ma(b.timeout)&&ca(b.ontimeout)}function vo(b){return"content-type"==b.toLowerCase()}
po.prototype.Fc=function(){"undefined"!=typeof aa&&this.fa&&(this.g="Timed out after "+this.j+"ms, aborting",this.s("timeout"),this.fa&&this.a&&(this.a=!1,this.f=!0,this.fa.abort(),this.f=!1,this.s("complete"),this.s("abort"),yo(this)))};function uo(b,c){b.a=!1;b.fa&&(b.f=!0,b.fa.abort(),b.f=!1);b.g=c;zo(b);yo(b)}function zo(b){b.G||(b.G=!0,b.s("complete"),b.s("error"))}po.prototype.X=function(){this.fa&&(this.a&&(this.a=!1,this.f=!0,this.fa.abort(),this.f=!1),yo(this,!0));po.da.X.call(this)};
po.prototype.D=function(){this.pa||(this.B||this.c||this.f?Ao(this):this.T())};po.prototype.T=function(){Ao(this)};function Ao(b){if(b.a&&"undefined"!=typeof aa&&(!b.l[1]||4!=Bo(b)||2!=Co(b)))if(b.c&&4==Bo(b))bo(b.D,0,b);else if(b.s("readystatechange"),4==Bo(b)){b.a=!1;try{if(Do(b))b.s("complete"),b.s("success");else{var c;try{c=2<Bo(b)?b.fa.statusText:""}catch(d){c=""}b.g=c+" ["+Co(b)+"]";zo(b)}}finally{yo(b)}}}
function yo(b,c){if(b.fa){wo(b);var d=b.fa,e=b.l[0]?da:null;b.fa=null;b.l=null;c||b.s("ready");try{d.onreadystatechange=e}catch(f){}}}function wo(b){b.fa&&b.C&&(b.fa.ontimeout=null);ma(b.b)&&(ba.clearTimeout(b.b),b.b=null)}
function Do(b){var c=Co(b),d;a:switch(c){case 200:case 201:case 202:case 204:case 206:case 304:case 1223:d=!0;break a;default:d=!1}if(!d){if(c=0===c)b=String(b.v).match(ko)[1]||null,!b&&ba.self&&ba.self.location&&(b=ba.self.location.protocol,b=b.substr(0,b.length-1)),c=!ro.test(b?b.toLowerCase():"");d=c}return d}function Bo(b){return b.fa?b.fa.readyState:0}function Co(b){try{return 2<Bo(b)?b.fa.status:-1}catch(c){return-1}}function Eo(b){try{return b.fa?b.fa.responseText:""}catch(c){return""}}
function Fo(b){try{if(!b.fa)return null;if("response"in b.fa)return b.fa.response;switch(b.i){case qo:case "text":return b.fa.responseText;case "arraybuffer":if("mozResponseArrayBuffer"in b.fa)return b.fa.mozResponseArrayBuffer}return null}catch(c){return null}};function Go(b,c,d,e,f,g){sh.call(this,b,c);this.l=Mi();this.i=e;this.g=null;this.f=g;this.b={md:!1,Xf:null,Xh:-1,Wc:null};this.G=f;this.j=d}z(Go,sh);l=Go.prototype;l.X=function(){Go.da.X.call(this)};l.Tl=function(){return this.i};l.bb=function(){return this.j};l.load=function(){0==this.state&&(this.state=1,th(this),this.G(this,this.j),this.o(null,NaN,this.f))};l.di=function(b){this.g=b;this.state=2;th(this)};l.hi=function(b){this.o=b};function Ho(){if(!Wb)return!1;try{return new ActiveXObject("MSXML2.DOMDocument"),!0}catch(b){return!1}}var Io=Wb&&Ho();function Jo(b){var c=b.xml;if(c)return c;if("undefined"!=typeof XMLSerializer)return(new XMLSerializer).serializeToString(b);throw Error("Your browser does not support serializing XML documents");};var Ko;a:if(document.implementation&&document.implementation.createDocument)Ko=document.implementation.createDocument("","",null);else{if(Io){var Lo=new ActiveXObject("MSXML2.DOMDocument");if(Lo){Lo.resolveExternals=!1;Lo.validateOnParse=!1;try{Lo.setProperty("ProhibitDTD",!0),Lo.setProperty("MaxXMLSize",2048),Lo.setProperty("MaxElementDepth",256)}catch(b){}}if(Lo){Ko=Lo;break a}}throw Error("Your browser does not support creating new documents");}var Mo=Ko;
function No(b,c){return Mo.createElementNS(b,c)}function Oo(b,c){b||(b="");return Mo.createNode(1,c,b)}var Po=document.implementation&&document.implementation.createDocument?No:Oo;function Qo(b,c){return Ro(b,c,[]).join("")}function Ro(b,c,d){if(4==b.nodeType||3==b.nodeType)c?d.push(String(b.nodeValue).replace(/(\r\n|\r|\n)/g,"")):d.push(b.nodeValue);else for(b=b.firstChild;b;b=b.nextSibling)Ro(b,c,d);return d}function So(b){return b.localName}
function To(b){var c=b.localName;return void 0!==c?c:b.baseName}var Uo=Wb?To:So;function Vo(b){return b instanceof Document}function Wo(b){return oa(b)&&9==b.nodeType}var Xo=Wb?Wo:Vo;function Yo(b){return b instanceof Node}function Zo(b){return oa(b)&&void 0!==b.nodeType}var $o=Wb?Zo:Yo;function ap(b,c,d){return b.getAttributeNS(c,d)||""}function bp(b,c,d){var e="";b=cp(b,c,d);void 0!==b&&(e=b.nodeValue);return e}var dp=document.implementation&&document.implementation.createDocument?ap:bp;
function ep(b,c,d){return b.getAttributeNodeNS(c,d)}function fp(b,c,d){var e=null;b=b.attributes;for(var f,g,h=0,k=b.length;h<k;++h)if(f=b[h],f.namespaceURI==c&&(g=f.prefix?f.prefix+":"+d:d,g==f.nodeName)){e=f;break}return e}var cp=document.implementation&&document.implementation.createDocument?ep:fp;function gp(b,c,d,e){b.setAttributeNS(c,d,e)}function hp(b,c,d,e){c?(c=b.ownerDocument.createNode(2,d,c),c.nodeValue=e,b.setAttributeNode(c)):b.setAttribute(d,e)}
var ip=document.implementation&&document.implementation.createDocument?gp:hp;function jp(b){return(new DOMParser).parseFromString(b,"application/xml")}function kp(b,c){return function(d,e){var f=b.call(c,d,e);void 0!==f&&jb(e[e.length-1],f)}}function lp(b,c){return function(d,e){var f=b.call(void 0!==c?c:this,d,e);void 0!==f&&e[e.length-1].push(f)}}function mp(b,c){return function(d,e){var f=b.call(void 0!==c?c:this,d,e);void 0!==f&&(e[e.length-1]=f)}}
function np(b){return function(c,d){var e=b.call(this,c,d);void 0!==e&&Qb(d[d.length-1],c.localName).push(e)}}function N(b,c){return function(d,e){var f=b.call(this,d,e);void 0!==f&&(e[e.length-1][void 0!==c?c:d.localName]=f)}}function O(b,c){return function(d,e,f){b.call(void 0!==c?c:this,d,e,f);f[f.length-1].node.appendChild(d)}}function op(b){var c,d;return function(e,f,g){if(void 0===c){c={};var h={};h[e.localName]=b;c[e.namespaceURI]=h;d=pp(e.localName)}qp(c,d,f,g)}}
function pp(b,c){return function(d,e,f){d=e[e.length-1].node;e=b;void 0===e&&(e=f);f=c;void 0===c&&(f=d.namespaceURI);return Po(f,e)}}var rp=pp();function sp(b,c){for(var d=c.length,e=Array(d),f=0;f<d;++f)e[f]=b[c[f]];return e}function Q(b,c,d){d=void 0!==d?d:{};var e,f;e=0;for(f=b.length;e<f;++e)d[b[e]]=c;return d}function tp(b,c,d,e){for(c=c.firstElementChild;c;c=c.nextElementSibling){var f=b[c.namespaceURI];void 0!==f&&(f=f[c.localName],void 0!==f&&f.call(e,c,d))}}
function S(b,c,d,e,f){e.push(b);tp(c,d,e,f);return e.pop()}function qp(b,c,d,e,f,g){for(var h=(void 0!==f?f:d).length,k,m,n=0;n<h;++n)k=d[n],void 0!==k&&(m=c.call(g,k,e,void 0!==f?f[n]:void 0),void 0!==m&&b[m.namespaceURI][m.localName].call(g,m,k,e))}function up(b,c,d,e,f,g,h){f.push(b);qp(c,d,e,f,g,h);f.pop()};function vp(b,c,d,e){return function(f,g,h){var k=new po;k.i="arraybuffer"==c.V()?"arraybuffer":"text";D(k,"complete",function(b){b=b.target;if(Do(b)){var f=c.V(),g;if("json"==f)g=Eo(b);else if("text"==f)g=Eo(b);else if("xml"==f){if(!Wb)try{g=b.fa?b.fa.responseXML:null}catch(k){g=null}g||(g=jp(Eo(b)))}else"arraybuffer"==f&&(g=Fo(b));g&&d.call(this,c.Ca(g,{featureProjection:h}),c.Ka(g))}else e.call(this);qc(b)},!1,this);na(b)?to(k,b(f,g,h)):to(k,b)}}
function wp(b,c){return vp(b,c,function(b,c){var f=c.a;"tile-pixels"===f&&(this.f=new Be({code:this.f.Ya,units:f}));this.di(b)},function(){this.state=3;th(this)})}function xp(b,c){return vp(b,c,function(b){this.Ic(b)},ya)};function yp(){return[[-Infinity,-Infinity,Infinity,Infinity]]};var zp,Ap,Bp,Cp;
(function(){var b={ka:{}};(function(){function c(b,d){if(!(this instanceof c))return new c(b,d);this.df=Math.max(4,b||9);this.lg=Math.max(2,Math.ceil(.4*this.df));d&&this.ij(d);this.clear()}function d(b,c){b.bbox=e(b,0,b.children.length,c)}function e(b,c,d,e){for(var g=[Infinity,Infinity,-Infinity,-Infinity],h;c<d;c++)h=b.children[c],f(g,b.Ga?e(h):h.bbox);return g}function f(b,c){b[0]=Math.min(b[0],c[0]);b[1]=Math.min(b[1],c[1]);b[2]=Math.max(b[2],c[2]);b[3]=Math.max(b[3],c[3])}function g(b,c){return b.bbox[0]-
c.bbox[0]}function h(b,c){return b.bbox[1]-c.bbox[1]}function k(b){return(b[2]-b[0])*(b[3]-b[1])}function m(b){return b[2]-b[0]+(b[3]-b[1])}function n(b,c){return b[0]<=c[0]&&b[1]<=c[1]&&c[2]<=b[2]&&c[3]<=b[3]}function p(b,c){return c[0]<=b[2]&&c[1]<=b[3]&&c[2]>=b[0]&&c[3]>=b[1]}function q(b,c,d,e,f){for(var g=[c,d],h;g.length;)d=g.pop(),c=g.pop(),d-c<=e||(h=c+Math.ceil((d-c)/e/2)*e,r(b,c,d,h,f),g.push(c,h,h,d))}function r(b,c,d,e,f){for(var g,h,k,m,n;d>c;){600<d-c&&(g=d-c+1,h=e-c+1,k=Math.log(g),
m=.5*Math.exp(2*k/3),n=.5*Math.sqrt(k*m*(g-m)/g)*(0>h-g/2?-1:1),k=Math.max(c,Math.floor(e-h*m/g+n)),h=Math.min(d,Math.floor(e+(g-h)*m/g+n)),r(b,k,h,e,f));g=b[e];h=c;m=d;t(b,c,e);for(0<f(b[d],g)&&t(b,c,d);h<m;){t(b,h,m);h++;for(m--;0>f(b[h],g);)h++;for(;0<f(b[m],g);)m--}0===f(b[c],g)?t(b,c,m):(m++,t(b,m,d));m<=e&&(c=m+1);e<=m&&(d=m-1)}}function t(b,c,d){var e=b[c];b[c]=b[d];b[d]=e}c.prototype={all:function(){return this.gg(this.data,[])},search:function(b){var c=this.data,d=[],e=this.hb;if(!p(b,c.bbox))return d;
for(var f=[],g,h,k,m;c;){g=0;for(h=c.children.length;g<h;g++)k=c.children[g],m=c.Ga?e(k):k.bbox,p(b,m)&&(c.Ga?d.push(k):n(b,m)?this.gg(k,d):f.push(k));c=f.pop()}return d},load:function(b){if(!b||!b.length)return this;if(b.length<this.lg){for(var c=0,d=b.length;c<d;c++)this.za(b[c]);return this}b=this.ig(b.slice(),0,b.length-1,0);this.data.children.length?this.data.height===b.height?this.ng(this.data,b):(this.data.height<b.height&&(c=this.data,this.data=b,b=c),this.kg(b,this.data.height-b.height-1,
!0)):this.data=b;return this},za:function(b){b&&this.kg(b,this.data.height-1);return this},clear:function(){this.data={children:[],height:1,bbox:[Infinity,Infinity,-Infinity,-Infinity],Ga:!0};return this},remove:function(b){if(!b)return this;for(var c=this.data,d=this.hb(b),e=[],f=[],g,h,k,m;c||e.length;){c||(c=e.pop(),h=e[e.length-1],g=f.pop(),m=!0);if(c.Ga&&(k=c.children.indexOf(b),-1!==k)){c.children.splice(k,1);e.push(c);this.gj(e);break}m||c.Ga||!n(c.bbox,d)?h?(g++,c=h.children[g],m=!1):c=null:
(e.push(c),f.push(g),g=0,h=c,c=c.children[0])}return this},hb:function(b){return b},hf:function(b,c){return b[0]-c[0]},jf:function(b,c){return b[1]-c[1]},toJSON:function(){return this.data},gg:function(b,c){for(var d=[];b;)b.Ga?c.push.apply(c,b.children):d.push.apply(d,b.children),b=d.pop();return c},ig:function(b,c,e,f){var g=e-c+1,h=this.df,k;if(g<=h)return k={children:b.slice(c,e+1),height:1,bbox:null,Ga:!0},d(k,this.hb),k;f||(f=Math.ceil(Math.log(g)/Math.log(h)),h=Math.ceil(g/Math.pow(h,f-1)));
k={children:[],height:f,bbox:null,Ga:!1};var g=Math.ceil(g/h),h=g*Math.ceil(Math.sqrt(h)),m,n,p;for(q(b,c,e,h,this.hf);c<=e;c+=h)for(n=Math.min(c+h-1,e),q(b,c,n,g,this.jf),m=c;m<=n;m+=g)p=Math.min(m+g-1,n),k.children.push(this.ig(b,m,p,f-1));d(k,this.hb);return k},fj:function(b,c,d,e){for(var f,g,h,m,n,p,q,r;;){e.push(c);if(c.Ga||e.length-1===d)break;q=r=Infinity;f=0;for(g=c.children.length;f<g;f++)h=c.children[f],n=k(h.bbox),p=h.bbox,p=(Math.max(p[2],b[2])-Math.min(p[0],b[0]))*(Math.max(p[3],b[3])-
Math.min(p[1],b[1]))-n,p<r?(r=p,q=n<q?n:q,m=h):p===r&&n<q&&(q=n,m=h);c=m}return c},kg:function(b,c,d){var e=this.hb;d=d?b.bbox:e(b);var e=[],g=this.fj(d,this.data,c,e);g.children.push(b);for(f(g.bbox,d);0<=c;)if(e[c].children.length>this.df)this.oj(e,c),c--;else break;this.cj(d,e,c)},oj:function(b,c){var e=b[c],f=e.children.length,g=this.lg;this.dj(e,g,f);f=this.ej(e,g,f);f={children:e.children.splice(f,e.children.length-f),height:e.height,bbox:null,Ga:!1};e.Ga&&(f.Ga=!0);d(e,this.hb);d(f,this.hb);
c?b[c-1].children.push(f):this.ng(e,f)},ng:function(b,c){this.data={children:[b,c],height:b.height+1,bbox:null,Ga:!1};d(this.data,this.hb)},ej:function(b,c,d){var f,g,h,m,n,p,q;n=p=Infinity;for(f=c;f<=d-c;f++)g=e(b,0,f,this.hb),h=e(b,f,d,this.hb),m=Math.max(0,Math.min(g[2],h[2])-Math.max(g[0],h[0]))*Math.max(0,Math.min(g[3],h[3])-Math.max(g[1],h[1])),g=k(g)+k(h),m<n?(n=m,q=f,p=g<p?g:p):m===n&&g<p&&(p=g,q=f);return q},dj:function(b,c,d){var e=b.Ga?this.hf:g,f=b.Ga?this.jf:h,k=this.hg(b,c,d,e);c=this.hg(b,
c,d,f);k<c&&b.children.sort(e)},hg:function(b,c,d,g){b.children.sort(g);g=this.hb;var h=e(b,0,c,g),k=e(b,d-c,d,g),n=m(h)+m(k),p,q;for(p=c;p<d-c;p++)q=b.children[p],f(h,b.Ga?g(q):q.bbox),n+=m(h);for(p=d-c-1;p>=c;p--)q=b.children[p],f(k,b.Ga?g(q):q.bbox),n+=m(k);return n},cj:function(b,c,d){for(;0<=d;d--)f(c[d].bbox,b)},gj:function(b){for(var c=b.length-1,e;0<=c;c--)0===b[c].children.length?0<c?(e=b[c-1].children,e.splice(e.indexOf(b[c]),1)):this.clear():d(b[c],this.hb)},ij:function(b){var c=["return a",
" - b",";"];this.hf=new Function("a","b",c.join(b[0]));this.jf=new Function("a","b",c.join(b[1]));this.hb=new Function("a","return [a"+b.join(", a")+"];")}};"undefined"!==typeof b?b.ka=c:"undefined"!==typeof self?self.a=c:window.a=c})();zp=b.ka})();function Dp(b){this.f=zp(b);this.a={}}l=Dp.prototype;l.za=function(b,c){var d=[b[0],b[1],b[2],b[3],c];this.f.za(d);this.a[w(c)]=d};l.load=function(b,c){for(var d=Array(c.length),e=0,f=c.length;e<f;e++){var g=b[e],h=c[e],g=[g[0],g[1],g[2],g[3],h];d[e]=g;this.a[w(h)]=g}this.f.load(d)};l.remove=function(b){b=w(b);var c=this.a[b];delete this.a[b];return null!==this.f.remove(c)};function Ep(b,c,d){var e=w(d);$d(b.a[e].slice(0,4),c)||(b.remove(d),b.za(c,d))}
function Fp(b){return b.f.all().map(function(b){return b[4]})}function Gp(b,c){return b.f.search(c).map(function(b){return b[4]})}l.forEach=function(b,c){return Hp(Fp(this),b,c)};function Ip(b,c,d,e){return Hp(Gp(b,c),d,e)}function Hp(b,c,d){for(var e,f=0,g=b.length;f<g&&!(e=c.call(d,b[f]));f++);return e}l.Na=function(){return Nb(this.a)};l.clear=function(){this.f.clear();this.a={}};l.J=function(){return this.f.data.bbox};function Jp(b){b=b||{};uh.call(this,{attributions:b.attributions,logo:b.logo,projection:void 0,state:"ready",wrapX:void 0!==b.wrapX?b.wrapX:!0});this.T=ya;void 0!==b.loader?this.T=b.loader:void 0!==b.url&&(this.T=xp(b.url,b.format));this.na=void 0!==b.strategy?b.strategy:yp;var c=void 0!==b.useSpatialIndex?b.useSpatialIndex:!0;this.a=c?new Dp:null;this.Y=new Dp;this.g={};this.j={};this.l={};this.o={};this.c=null;var d,e;b.features instanceof mg?(d=b.features,e=d.a):ia(b.features)&&(e=b.features);
c||void 0!==d||(d=new mg(e));void 0!==e&&Kp(this,e);void 0!==d&&Lp(this,d)}z(Jp,uh);l=Jp.prototype;l.Dd=function(b){var c=w(b).toString();if(Mp(this,c,b)){Np(this,c,b);var d=b.W();d?(c=d.J(),this.a&&this.a.za(c,b)):this.g[c]=b;this.s(new Op("addfeature",b))}this.u()};function Np(b,c,d){b.o[c]=[D(d,"change",b.zh,!1,b),D(d,"propertychange",b.zh,!1,b)]}function Mp(b,c,d){var e=!0,f=d.Qa();void 0!==f?f.toString()in b.j?e=!1:b.j[f.toString()]=d:b.l[c]=d;return e}l.Ic=function(b){Kp(this,b);this.u()};
function Kp(b,c){var d,e,f,g,h=[],k=[],m=[];e=0;for(f=c.length;e<f;e++)g=c[e],d=w(g).toString(),Mp(b,d,g)&&k.push(g);e=0;for(f=k.length;e<f;e++){g=k[e];d=w(g).toString();Np(b,d,g);var n=g.W();n?(d=n.J(),h.push(d),m.push(g)):b.g[d]=g}b.a&&b.a.load(h,m);e=0;for(f=k.length;e<f;e++)b.s(new Op("addfeature",k[e]))}
function Lp(b,c){var d=!1;D(b,"addfeature",function(b){d||(d=!0,c.push(b.feature),d=!1)});D(b,"removefeature",function(b){d||(d=!0,c.remove(b.feature),d=!1)});D(c,"add",function(b){d||(b=b.element,d=!0,this.Dd(b),d=!1)},!1,b);D(c,"remove",function(b){d||(b=b.element,d=!0,this.Sc(b),d=!1)},!1,b);b.c=c}
l.clear=function(b){if(b){for(var c in this.o)this.o[c].forEach(Wc);this.c||(this.o={},this.j={},this.l={})}else b=this.Wh,this.a&&(this.a.forEach(b,this),Hb(this.g,b,this));this.c&&this.c.clear();this.a&&this.a.clear();this.Y.clear();this.g={};this.s(new Op("clear"));this.u()};l.wg=function(b,c){if(this.a)return this.a.forEach(b,c);if(this.c)return this.c.forEach(b,c)};function Pp(b,c,d){b.rb([c[0],c[1],c[0],c[1]],function(b){if(b.W().sg(c))return d.call(void 0,b)})}
l.rb=function(b,c,d){if(this.a)return Ip(this.a,b,c,d);if(this.c)return this.c.forEach(c,d)};l.xg=function(b,c,d){return this.rb(b,function(e){if(e.W().Fa(b)&&(e=c.call(d,e)))return e})};l.Eg=function(){return this.c};l.Be=function(){var b;this.c?b=this.c.a:this.a&&(b=Fp(this.a),Nb(this.g)||jb(b,Kb(this.g)));return b};l.Dg=function(b){var c=[];Pp(this,b,function(b){c.push(b)});return c};l.pf=function(b){return Gp(this.a,b)};
l.zg=function(b){var c=b[0],d=b[1],e=null,f=[NaN,NaN],g=Infinity,h=[-Infinity,-Infinity,Infinity,Infinity];Ip(this.a,h,function(b){var m=b.W(),n=g;g=m.pb(c,d,f,g);g<n&&(e=b,b=Math.sqrt(g),h[0]=c-b,h[1]=d-b,h[2]=c+b,h[3]=d+b)});return e};l.J=function(){return this.a.J()};l.Cg=function(b){b=this.j[b.toString()];return void 0!==b?b:null};
l.zh=function(b){b=b.target;var c=w(b).toString(),d=b.W();d?(d=d.J(),c in this.g?(delete this.g[c],this.a&&this.a.za(d,b)):this.a&&Ep(this.a,d,b)):c in this.g||(this.a&&this.a.remove(b),this.g[c]=b);d=b.Qa();void 0!==d?(d=d.toString(),c in this.l?(delete this.l[c],this.j[d]=b):this.j[d]!==b&&(Qp(this,b),this.j[d]=b)):c in this.l||(Qp(this,b),this.l[c]=b);this.u();this.s(new Op("changefeature",b))};l.Na=function(){return this.a.Na()&&Nb(this.g)};
l.Oc=function(b,c,d){var e=this.Y;b=this.na(b,c);var f,g;f=0;for(g=b.length;f<g;++f){var h=b[f];Ip(e,h,function(b){return Ud(b.extent,h)})||(this.T.call(this,h,c,d),e.za(h,{extent:h.slice()}))}};l.Sc=function(b){var c=w(b).toString();c in this.g?delete this.g[c]:this.a&&this.a.remove(b);this.Wh(b);this.u()};l.Wh=function(b){var c=w(b).toString();this.o[c].forEach(Wc);delete this.o[c];var d=b.Qa();void 0!==d?delete this.j[d.toString()]:delete this.l[c];this.s(new Op("removefeature",b))};
function Qp(b,c){for(var d in b.j)if(b.j[d]===c){delete b.j[d];break}}function Op(b,c){rc.call(this,b);this.feature=c}z(Op,rc);function Rp(b){this.c=b.source;this.xa=Ad();this.g=Mi();this.j=[0,0];this.v=null;tn.call(this,{attributions:b.attributions,canvasFunction:this.zj.bind(this),logo:b.logo,projection:b.projection,ratio:b.ratio,resolutions:b.resolutions,state:this.c.B});this.T=null;this.o=void 0;this.vh(b.style);D(this.c,"change",this.Wm,void 0,this)}z(Rp,tn);l=Rp.prototype;
l.zj=function(b,c,d,e,f){var g=new Tm(.5*c/d,b,c);this.c.Oc(b,c,f);var h=!1;this.c.rb(b,function(b){var e;if(!(e=h)){var f;(e=b.cc())?f=e.call(b,c):this.o&&(f=this.o(b,c));if(f){var p,q=!1;e=0;for(p=f.length;e<p;++e)q=$m(g,b,f[e],Zm(c,d),this.Vm,this)||q;e=q}else e=!1}h=e},this);Um(g);if(h)return null;this.j[0]!=e[0]||this.j[1]!=e[1]?(this.g.canvas.width=e[0],this.g.canvas.height=e[1],this.j[0]=e[0],this.j[1]=e[1]):this.g.clearRect(0,0,e[0],e[1]);b=Sp(this,ke(b),c,d,e);g.f(this.g,d,b,0,{});this.v=
g;return this.g.canvas};l.Ae=function(b,c,d,e,f){if(this.v){var g={};return this.v.c(b,c,0,e,function(b){var c=w(b).toString();if(!(c in g))return g[c]=!0,f(b)})}};l.Sm=function(){return this.c};l.Tm=function(){return this.T};l.Um=function(){return this.o};function Sp(b,c,d,e,f){return fk(b.xa,f[0]/2,f[1]/2,e/d,-e/d,0,-c[0],-c[1])}l.Vm=function(){this.u()};l.Wm=function(){wh(this,this.c.B)};l.vh=function(b){this.T=void 0!==b?b:im;this.o=b?gm(this.T):void 0;this.u()};function Tp(b){zm.call(this,b);this.g=null;this.i=Ad();this.b=this.c=null}z(Tp,zm);l=Tp.prototype;l.cb=function(b,c,d,e){var f=this.a;return f.ea().Ae(b,c.viewState.resolution,c.viewState.rotation,c.skippedFeatureUids,function(b){return d.call(e,b,f)})};
l.zc=function(b,c,d,e){if(this.Bd())if(this.a.ea()instanceof Rp){if(b=b.slice(),hk(c.pixelToCoordinateMatrix,b,b),this.cb(b,c,se,this))return d.call(e,this.a)}else if(this.c||(this.c=Ad(),Gd(this.i,this.c)),c=Cm(b,this.c),this.b||(this.b=Mi(1,1)),this.b.clearRect(0,0,1,1),this.b.drawImage(this.Bd(),c[0],c[1],1,1,0,0,1,1),0<this.b.getImageData(0,0,1,1).data[3])return d.call(e,this.a)};l.Bd=function(){return this.g?this.g.a():null};l.qf=function(){return this.i};
l.Cd=function(b,c){var d=b.pixelRatio,e=b.viewState,f=e.center,g=e.resolution,h=e.rotation,k=this.a.ea(),m=b.viewHints,n=b.extent;void 0!==c.extent&&(n=me(n,c.extent));m[0]||m[1]||he(n)||(e=k.C(n,g,d,e.projection))&&kk(this,e)&&(this.g=e);if(this.g){var e=this.g,m=e.J(),n=e.$(),p=e.b,g=d*n/(g*p);fk(this.i,d*b.size[0]/2,d*b.size[1]/2,g,g,h,p*(m[0]-f[0])/n,p*(f[1]-m[3])/n);this.c=null;mk(b.attributions,e.i);nk(b,k)}return!0};function Up(b){zm.call(this,b);this.b=this.i=null;this.o=!1;this.j=null;this.B=Ad();this.g=null;this.C=this.D=this.v=NaN;this.l=this.c=null;this.U=[0,0]}z(Up,zm);Up.prototype.Bd=function(){return this.i};Up.prototype.qf=function(){return this.B};
Up.prototype.Cd=function(b,c){function d(b){b=b.state;return 2==b||4==b||3==b&&!I}var e=b.pixelRatio,f=b.viewState,g=f.projection,h=this.a,k=h.ea(),m=k.kb(g),n=k.ce(),p=Gh(m,f.resolution),q=Nh(k,p,b.pixelRatio,g),r=q[0]/ld(m.Ma(p),this.U)[0],t=m.$(p),r=t/r,v=f.center,x;t==f.resolution?(v=pk(v,t,b.size),x=le(v,t,f.rotation,b.size)):x=b.extent;void 0!==c.extent&&(x=me(x,c.extent));if(he(x))return!1;var C=Dh(m,x,t),A=q[0]*ig(C),y=q[1]*hg(C),B,M;this.i?(B=this.i,M=this.j,this.b[0]<A||this.b[1]<y||this.D!==
q[0]||this.C!==q[1]||this.o&&(this.b[0]>A||this.b[1]>y)?(B.width=A,B.height=y,this.b=[A,y],this.o=!Dm(this.b),this.c=null):(A=this.b[0],y=this.b[1],p==this.v&&fg(this.c,C)||(this.c=null))):(M=Mi(A,y),this.i=M.canvas,this.b=[A,y],this.j=M,this.o=!Dm(this.b));var K,E;this.c?(y=this.c,A=ig(y)):(A/=q[0],y/=q[1],K=C.a-Math.floor((A-ig(C))/2),E=C.f-Math.floor((y-hg(C))/2),this.v=p,this.D=q[0],this.C=q[1],this.c=new cg(K,K+A-1,E,E+y-1),this.l=Array(A*y),y=this.c);B={};B[p]={};var P=[],fa=this.ed(k,g,B),
I=h.b(),ga=Ld(),Ja=new cg(0,0,0,0),Sa,R,ja;for(E=C.a;E<=C.c;++E)for(ja=C.f;ja<=C.b;++ja)R=k.Qb(p,E,ja,e,g),!d(R)&&R.a&&(R=R.a),d(R)?B[p][R.ga.toString()]=R:(Sa=Ah(m,R.ga,fa,Ja,ga),Sa||(P.push(R),(Sa=Ch(m,R.ga,Ja,ga))&&fa(p+1,Sa)));fa=0;for(Sa=P.length;fa<Sa;++fa)R=P[fa],E=q[0]*(R.ga[1]-y.a),ja=q[1]*(y.b-R.ga[2]),M.clearRect(E,ja,q[0],q[1]);P=Object.keys(B).map(Number);P.sort(tb);var sc=k.tf(g),zc=fe(m.Ba([p,y.a,y.b],ga)),uf,xj,Zd,ai,dg,wm,fa=0;for(Sa=P.length;fa<Sa;++fa)if(uf=P[fa],q=Nh(k,uf,e,g),
ai=B[uf],uf==p)for(xj in ai)R=ai[xj],K=(R.ga[2]-y.f)*A+(R.ga[1]-y.a),this.l[K]!=R&&(E=q[0]*(R.ga[1]-y.a),ja=q[1]*(y.b-R.ga[2]),Zd=R.state,4!=Zd&&(3!=Zd||I)&&sc||M.clearRect(E,ja,q[0],q[1]),2==Zd&&M.drawImage(R.Ua(),n,n,q[0],q[1],E,ja,q[0],q[1]),this.l[K]=R);else for(xj in uf=m.$(uf)/t,ai)for(R=ai[xj],K=m.Ba(R.ga,ga),E=(K[0]-zc[0])/r,ja=(zc[1]-K[3])/r,wm=uf*q[0],dg=uf*q[1],Zd=R.state,4!=Zd&&sc||M.clearRect(E,ja,wm,dg),2==Zd&&M.drawImage(R.Ua(),n,n,q[0],q[1],E,ja,wm,dg),R=Bh(m,K,p,Ja),K=Math.max(R.a,
y.a),ja=Math.min(R.c,y.c),E=Math.max(R.f,y.f),R=Math.min(R.b,y.b),Zd=K;Zd<=ja;++Zd)for(dg=E;dg<=R;++dg)K=(dg-y.f)*A+(Zd-y.a),this.l[K]=void 0;ok(b.usedTiles,k,p,C);qk(b,k,m,e,g,x,p,h.a());lk(b,k);nk(b,k);fk(this.B,e*b.size[0]/2,e*b.size[1]/2,e*r/f.resolution,e*r/f.resolution,f.rotation,(zc[0]-v[0])/r,(v[1]-zc[1])/r);this.g=null;return!0};
Up.prototype.zc=function(b,c,d,e){if(this.j&&(this.g||(this.g=Ad(),Gd(this.B,this.g)),b=Cm(b,this.g),0<this.j.getImageData(b[0],b[1],1,1).data[3]))return d.call(e,this.a)};function Vp(b){zm.call(this,b);this.c=!1;this.o=-1;this.l=NaN;this.i=Ld();this.b=this.j=null;this.g=Mi()}z(Vp,zm);
Vp.prototype.G=function(b,c,d){var e=b.extent,f=b.pixelRatio,g=c.Db?b.skippedFeatureUids:{},h=b.viewState,k=h.projection,h=h.rotation,m=k.J(),n=this.a.ea(),p=Bm(this,b,0);Am(this,"precompose",d,b,p);var q=this.b;if(q&&!q.Na()){var r;bd(this.a,"render")?(this.g.canvas.width=d.canvas.width,this.g.canvas.height=d.canvas.height,r=this.g):r=d;var t=r.globalAlpha;r.globalAlpha=c.opacity;q.f(r,f,p,h,g);if(n.O&&k.f&&!Ud(m,e)){c=e[0];k=ie(m);for(n=0;c<m[0];)--n,p=k*n,p=Bm(this,b,p),q.f(r,f,p,h,g),c+=k;n=0;
for(c=e[2];c>m[2];)++n,p=k*n,p=Bm(this,b,p),q.f(r,f,p,h,g),c-=k;p=Bm(this,b,0)}r!=d&&(Am(this,"render",r,b,p),d.drawImage(r.canvas,0,0));r.globalAlpha=t}Am(this,"postcompose",d,b,p)};Vp.prototype.cb=function(b,c,d,e){if(this.b){var f=c.viewState.resolution,g=c.viewState.rotation,h=this.a,k=c.layerStates[w(h)],m={};return this.b.c(b,f,g,k.Db?c.skippedFeatureUids:{},function(b){var c=w(b).toString();if(!(c in m))return m[c]=!0,d.call(e,b,h)})}};Vp.prototype.B=function(){jk(this)};
Vp.prototype.Cd=function(b){function c(b){var c,e=b.cc();e?c=e.call(b,n):(e=d.b)&&(c=e(b,n));if(c){if(c){e=!1;if(ia(c))for(var f=0,g=c.length;f<g;++f)e=$m(r,b,c[f],Zm(n,p),this.B,this)||e;else e=$m(r,b,c,Zm(n,p),this.B,this)||e;b=e}else b=!1;this.c=this.c||b}}var d=this.a,e=d.ea();mk(b.attributions,e.i);nk(b,e);var f=b.viewHints[0],g=b.viewHints[1],h=d.j,k=d.l;if(!this.c&&!h&&f||!k&&g)return!0;var m=b.extent,k=b.viewState,f=k.projection,n=k.resolution,p=b.pixelRatio,g=d.f,q=d.a,h=km(d);void 0===h&&
(h=Ym);m=Pd(m,q*n);q=k.projection.J();e.O&&k.projection.f&&!Ud(q,b.extent)&&(b=Math.max(ie(m)/2,ie(q)),m[0]=q[0]-b,m[2]=q[2]+b);if(!this.c&&this.l==n&&this.o==g&&this.j==h&&Ud(this.i,m))return!0;qc(this.b);this.b=null;this.c=!1;var r=new Tm(.5*n/p,m,n,d.a);e.Oc(m,n,f);if(h){var t=[];e.rb(m,function(b){t.push(b)},this);t.sort(h);t.forEach(c,this)}else e.rb(m,c,this);Um(r);this.l=n;this.o=g;this.j=h;this.i=m;this.b=r;return!0};function Wp(b,c){var d=/\{z\}/g,e=/\{x\}/g,f=/\{y\}/g,g=/\{-y\}/g;return function(h){if(h)return b.replace(d,h[0].toString()).replace(e,h[1].toString()).replace(f,function(){return(-h[2]-1).toString()}).replace(g,function(){return(hg(c.f?c.f[h[0]]:null)+h[2]).toString()})}}function Xp(b,c){for(var d=b.length,e=Array(d),f=0;f<d;++f)e[f]=Wp(b[f],c);return Yp(e)}function Yp(b){return 1===b.length?b[0]:function(c,d,e){if(c)return b[md((c[1]<<c[0])+c[2],b.length)](c,d,e)}}function Zp(){}
function $p(b){var c=[],d=/\{(\d)-(\d)\}/.exec(b)||/\{([a-z])-([a-z])\}/.exec(b);if(d){var e=d[2].charCodeAt(0),f;for(f=d[1].charCodeAt(0);f<=e;++f)c.push(b.replace(d[0],String.fromCharCode(f)))}else c.push(b);return c};function aq(b){Lh.call(this,{attributions:b.attributions,ff:b.ff,extent:b.extent,logo:b.logo,opaque:b.opaque,projection:b.projection,state:b.state?b.state:void 0,tileGrid:b.tileGrid,tilePixelRatio:b.tilePixelRatio,wrapX:b.wrapX});this.tileLoadFunction=b.tileLoadFunction;this.tileUrlFunction=this.ae||Zp;this.urls=null;b.urls?this.Xa(b.urls):b.url&&this.Wa(b.url);b.tileUrlFunction&&this.La(b.tileUrlFunction)}z(aq,Lh);l=aq.prototype;l.Za=function(){return this.tileLoadFunction};l.$a=function(){return this.tileUrlFunction};
l.ab=function(){return this.urls};l.yh=function(b){b=b.target;switch(b.state){case 1:this.s(new Ph("tileloadstart",b));break;case 2:this.s(new Ph("tileloadend",b));break;case 3:this.s(new Ph("tileloaderror",b))}};l.gb=function(b){this.a.clear();this.tileLoadFunction=b;this.u()};l.La=function(b){this.a.clear();this.tileUrlFunction=b;this.u()};l.Wa=function(b){this.urls=[b];b=$p(b);this.La(this.ae||Xp(b,this.tileGrid))};l.Xa=function(b){this.urls=b;this.La(this.ae||Xp(b,this.tileGrid))};
l.bg=function(b,c,d){b=this.Cb(b,c,d);oh(this.a,b)&&this.a.get(b)};function bq(b){aq.call(this,{attributions:b.attributions,ff:128,extent:b.extent,logo:b.logo,opaque:b.opaque,projection:b.projection,state:b.state?b.state:void 0,tileGrid:b.tileGrid,tileLoadFunction:b.tileLoadFunction?b.tileLoadFunction:cq,tileUrlFunction:b.tileUrlFunction,tilePixelRatio:b.tilePixelRatio,url:b.url,urls:b.urls,wrapX:void 0===b.wrapX?!0:b.wrapX});this.c=b.format?b.format:null;this.tileClass=b.tileClass?b.tileClass:Go}z(bq,aq);
bq.prototype.Qb=function(b,c,d,e,f){var g=this.Cb(b,c,d);if(oh(this.a,g))return this.a.get(g);b=[b,c,d];e=(c=Oh(this,b,f))?this.tileUrlFunction(c,e,f):void 0;f=new this.tileClass(b,void 0!==e?0:4,void 0!==e?e:"",this.c,this.tileLoadFunction,f);D(f,"change",this.yh,!1,this);this.a.set(g,f);return f};function cq(b,c){b.hi(wp(c,b.i))};function dq(b){zm.call(this,b);this.g=Mi();this.b=!1;this.i=[];this.j=Ld();this.o=[NaN,NaN];this.c=Ad()}z(dq,zm);
dq.prototype.G=function(b,c,d){var e=b.pixelRatio,f=c.Db?b.skippedFeatureUids:{},g=b.viewState,h=g.center,k=g.projection,m=g.resolution,g=g.rotation,n=b.size,p=e/m,q=this.a,r=q.ea(),t=r.vc(e),v=t/e,x=Bm(this,b,0);Am(this,"precompose",d,b,x);bd(q,"render")?(this.g.canvas.width=d.canvas.width,this.g.canvas.height=d.canvas.height,q=this.g):q=d;var C=q.globalAlpha;q.globalAlpha=c.opacity;c=this.i;var A=r.tileGrid,y,B,M,K,E,P,fa,I,ga,Ja,Sa,R,ja;M=0;for(K=c.length;M<K;++M)if(Sa=c[M],E=Sa.b,I=A.Ba(Sa.ga,
this.j),y=Sa.ga[0],B=ld(A.Ma(y),this.o),ga="tile-pixels"==Sa.f.a,P=A.$(y),R=P/t,Ja=P/m,P=Math.round(e*n[0]/2),fa=Math.round(e*n[1]/2),ja=B[0]*e*Ja,B=B[1]*e*Ja,1>ja||Ja>v)ga?(I=fe(I),R=fk(this.c,P,fa,p*R,p*R,g,(I[0]-h[0])/R,(h[1]-I[1])/R)):R=x,E.Wc.f(q,e,R,g,f);else{y=Nh(r,y,e,k);ga?R=fk(this.c,0,0,p*R,p*R,g,-y[0]/2,-y[1]/2):(R=ke(I),R=fk(this.c,0,0,p,-p,-g,-R[0],-R[1]));Sa=Sa.l;if(E.resolution!==m||E.rotation!==g)E.resolution=m,E.rotation=g,Sa.canvas.width=ja+.5,Sa.canvas.height=B+.5,Sa.translate(ja/
2,B/2),Sa.rotate(-g),E.Wc.f(Sa,e,R,g,f,!1);E=fk(this.c,0,0,p,-p,0,-h[0],-h[1]);E=af(fe(I),0,1,2,E);q.translate(P,fa);q.rotate(g);q.drawImage(Sa.canvas,Math.round(E[0]),Math.round(E[1]));q.rotate(-g);q.translate(-P,-fa)}q!=d&&(Am(this,"render",q,b,x),d.drawImage(q.canvas,0,0));q.globalAlpha=C;Am(this,"postcompose",d,b,x)};
function eq(b,c,d,e){function f(b){var c,e=b.cc();e?c=e.call(b,t):(e=d.b)&&(c=e(b,t));if(c){ia(c)||(c=[c]);var e=x,f=v;if(c){var g=!1;if(ia(c))for(var h=0,m=c.length;h<m;++h)g=$m(f,b,c[h],e,this.l,this)||g;else g=$m(f,b,c,e,this.l,this)||g;b=g}else b=!1;this.b=this.b||b;k.md=k.md||b}}var g=d.f,h=km(d)||null,k=c.b;if(k.md||k.Xh!=g||k.Xf!=h){qc(k.Wc);k.Wc=null;k.md=!1;var m=d.ea(),n=m.tileGrid,p=c.ga,q="tile-pixels"==c.f.a,r;q?(r=Nh(m,p[0],e,c.f),r=[0,0,r[0],r[1]]):r=n.Ba(p);var t=n.$(p[0]),m=q?m.vc(e):
t;k.md=!1;var v=new Tm(0,r,m,d.a),x=Zm(m,e);c=c.g;h&&h!==k.Xf&&c.sort(h);c.forEach(f,b);Um(v);k.Xh=g;k.Xf=h;k.Wc=v;k.resolution=NaN}}
dq.prototype.cb=function(b,c,d,e){var f=c.pixelRatio,g=c.viewState.resolution,h=c.viewState.rotation,k=this.a,m=c.layerStates[w(k)],n={},p=this.i,q=k.ea(),r=q.tileGrid,t,v,x,C,A,y;x=0;for(C=p.length;x<C;++x)y=p[x],v=y.ga,A=q.tileGrid.Ba(v,this.j),Sd(A,b)&&("tile-pixels"===y.f.a?(A=fe(A),g=q.vc(f),v=r.$(v[0])/g,v=[(b[0]-A[0])/v,(A[1]-b[1])/v]):v=b,y=y.b.Wc,t=t||y.c(v,g,h,m.Db?c.skippedFeatureUids:{},function(b){var c=w(b).toString();if(!(c in n))return n[c]=!0,d.call(e,b,k)}));return t};
dq.prototype.l=function(){jk(this)};
dq.prototype.Cd=function(b,c){var d=this.a,e=d.ea();mk(b.attributions,e.i);nk(b,e);var f=b.viewHints[0],g=b.viewHints[1],h=d.j,k=d.l;if(!this.b&&!h&&f||!k&&g)return!0;g=b.extent;c.extent&&(g=me(g,c.extent));if(he(g))return!1;for(var f=b.viewState,h=f.projection,k=f.resolution,f=b.pixelRatio,m=e.tileGrid,n=m.a,p=n.length-1;0<p&&n[p]<k;)--p;n=Bh(m,g,p);ok(b.usedTiles,e,p,n);qk(b,e,m,f,h,g,p,d.g());lk(b,e);g={};g[p]={};var q=this.ed(e,h,g),r=d.U(),t=this.j,v=new cg(0,0,0,0),x,C,A;for(C=n.a;C<=n.c;++C)for(A=
n.f;A<=n.b;++A)k=e.Qb(p,C,A,f,h),x=k.state,2==x||4==x||3==x&&!r?g[p][k.ga.toString()]=k:(x=Ah(m,k.ga,q,v,t),x||(k=Ch(m,k.ga,v,t))&&q(p+1,k));this.b=!1;e=Object.keys(g).map(Number);e.sort(tb);for(var h=[],y,m=0,p=e.length;m<p;++m)for(y in k=e[m],n=g[k],n)k=n[y],2==k.state&&(h.push(k),eq(this,k,d,f));this.i=h;return!0};function fq(b,c){wk.call(this,0,c);this.b=Mi();this.a=this.b.canvas;this.a.style.width="100%";this.a.style.height="100%";this.a.className="ol-unselectable";Jg(b,this.a,0);this.f=!0;this.g=Ad()}z(fq,wk);fq.prototype.kf=function(b){return b instanceof Rl?new Tp(b):b instanceof H?new Up(b):b instanceof L?new dq(b):b instanceof J?new Vp(b):null};
function gq(b,c,d){var e=b.i,f=b.b;if(bd(e,c)){var g=d.extent,h=d.pixelRatio,k=d.viewState.rotation,m=d.pixelRatio,n=d.viewState,p=n.resolution;b=fk(b.g,b.a.width/2,b.a.height/2,m/p,-m/p,-n.rotation,-n.center[0],-n.center[1]);g=new lm(f,h,g,b,k);e.s(new ak(c,e,g,d,f,null));ym(g)}}fq.prototype.V=function(){return"canvas"};
fq.prototype.Pe=function(b){if(b){var c=this.b,d=b.size[0]*b.pixelRatio,e=b.size[1]*b.pixelRatio;this.a.width!=d||this.a.height!=e?(this.a.width=d,this.a.height=e):c.clearRect(0,0,this.a.width,this.a.height);xk(b);gq(this,"precompose",b);d=b.layerStatesArray;ob(d);var e=b.viewState.resolution,f,g,h,k;f=0;for(g=d.length;f<g;++f)k=d[f],h=k.layer,h=zk(this,h),ck(k,e)&&"ready"==k.O&&h.Cd(b,k)&&h.G(b,k,c);gq(this,"postcompose",b);this.f||(eh(this.a,!0),this.f=!0);Ak(this,b);b.postRenderFunctions.push(yk)}else this.f&&
(eh(this.a,!1),this.f=!1)};function hq(b,c){ik.call(this,b);this.target=c}z(hq,ik);hq.prototype.g=ya;hq.prototype.l=ya;function iq(b){var c=document.createElement("DIV");c.style.position="absolute";hq.call(this,b,c);this.b=null;this.c=Cd()}z(iq,hq);iq.prototype.cb=function(b,c,d,e){var f=this.a;return f.ea().Ae(b,c.viewState.resolution,c.viewState.rotation,c.skippedFeatureUids,function(b){return d.call(e,b,f)})};iq.prototype.g=function(){Ig(this.target);this.b=null};
iq.prototype.i=function(b,c){var d=b.viewState,e=d.center,f=d.resolution,g=d.rotation,h=this.b,k=this.a.ea(),m=b.viewHints,n=b.extent;void 0!==c.extent&&(n=me(n,c.extent));m[0]||m[1]||he(n)||(d=k.C(n,f,b.pixelRatio,d.projection))&&kk(this,d)&&(h=d);h&&(m=h.J(),n=h.$(),d=Ad(),fk(d,b.size[0]/2,b.size[1]/2,n/f,n/f,g,(m[0]-e[0])/n,(e[1]-m[3])/n),h!=this.b&&(e=h.a(this),e.style.maxWidth="none",e.style.position="absolute",Ig(this.target),this.target.appendChild(e),this.b=h),gk(d,this.c)||(Qi(this.target,
d),Dd(this.c,d)),mk(b.attributions,h.i),nk(b,k));return!0};function jq(b){var c=document.createElement("DIV");c.style.position="absolute";hq.call(this,b,c);this.c=!0;this.o=1;this.j=0;this.b={}}z(jq,hq);jq.prototype.g=function(){Ig(this.target);this.j=0};
jq.prototype.i=function(b,c){if(!c.visible)return this.c&&(eh(this.target,!1),this.c=!1),!0;var d=b.pixelRatio,e=b.viewState,f=e.projection,g=this.a,h=g.ea(),k=h.kb(f),m=h.ce(),n=Gh(k,e.resolution),p=k.$(n),q=e.center,r;p==e.resolution?(q=pk(q,p,b.size),r=le(q,p,e.rotation,b.size)):r=b.extent;void 0!==c.extent&&(r=me(r,c.extent));var p=Dh(k,r,p),t={};t[n]={};var v=this.ed(h,f,t),x=g.b(),C=Ld(),A=new cg(0,0,0,0),y,B,M,K;for(M=p.a;M<=p.c;++M)for(K=p.f;K<=p.b;++K)y=h.Qb(n,M,K,d,f),B=y.state,B=2==B||
4==B||3==B&&!x,!B&&y.a&&(y=y.a),B=y.state,2==B?t[n][y.ga.toString()]=y:4==B||3==B&&!x||(B=Ah(k,y.ga,v,A,C),B||(y=Ch(k,y.ga,A,C))&&v(n+1,y));var E;if(this.j!=h.f){for(E in this.b)x=this.b[+E],Kg(x.target);this.b={};this.j=h.f}C=Object.keys(t).map(Number);C.sort(tb);var v={},P;M=0;for(K=C.length;M<K;++M){E=C[M];E in this.b?x=this.b[E]:(x=k.ie(q,E),x=new kq(k,x),v[E]=!0,this.b[E]=x);E=t[E];for(P in E){y=x;B=E[P];var fa=m,I=B.ga,ga=I[0],Ja=I[1],Sa=I[2],I=I.toString();if(!(I in y.f)){var ga=ld(y.g.Ma(ga),
y.l),R=B.Ua(y),ja=R.style;ja.maxWidth="none";var sc=void 0,zc=void 0;0<fa?(sc=document.createElement("DIV"),zc=sc.style,zc.overflow="hidden",zc.width=ga[0]+"px",zc.height=ga[1]+"px",ja.position="absolute",ja.left=-fa+"px",ja.top=-fa+"px",ja.width=ga[0]+2*fa+"px",ja.height=ga[1]+2*fa+"px",sc.appendChild(R)):(ja.width=ga[0]+"px",ja.height=ga[1]+"px",sc=R,zc=ja);zc.position="absolute";zc.left=(Ja-y.b[1])*ga[0]+"px";zc.top=(y.b[2]-Sa)*ga[1]+"px";y.a||(y.a=document.createDocumentFragment());y.a.appendChild(sc);
y.f[I]=B}}x.a&&(x.target.appendChild(x.a),x.a=null)}m=Object.keys(this.b).map(Number);m.sort(tb);M=Ad();P=0;for(C=m.length;P<C;++P)if(E=m[P],x=this.b[E],E in t)if(y=x.$(),K=x.Ea(),fk(M,b.size[0]/2,b.size[1]/2,y/e.resolution,y/e.resolution,e.rotation,(K[0]-q[0])/y,(q[1]-K[1])/y),x.setTransform(M),E in v){for(--E;0<=E;--E)if(E in this.b){K=this.b[E].target;K.parentNode&&K.parentNode.insertBefore(x.target,K.nextSibling);break}0>E&&Jg(this.target,x.target,0)}else{if(!b.viewHints[0]&&!b.viewHints[1]){B=
Bh(x.g,r,x.b[0],A);E=[];y=K=void 0;for(y in x.f)K=x.f[y],B.contains(K.ga)||E.push(K);fa=B=void 0;B=0;for(fa=E.length;B<fa;++B)K=E[B],y=K.ga.toString(),Kg(K.Ua(x)),delete x.f[y]}}else Kg(x.target),delete this.b[E];c.opacity!=this.o&&(this.o=this.target.style.opacity=c.opacity);c.visible&&!this.c&&(eh(this.target,!0),this.c=!0);ok(b.usedTiles,h,n,p);qk(b,h,k,d,f,r,n,g.a());lk(b,h);nk(b,h);return!0};
function kq(b,c){this.target=document.createElement("DIV");this.target.style.position="absolute";this.target.style.width="100%";this.target.style.height="100%";this.g=b;this.b=c;this.i=fe(b.Ba(c));this.j=b.$(c[0]);this.f={};this.a=null;this.c=Cd();this.l=[0,0]}kq.prototype.Ea=function(){return this.i};kq.prototype.$=function(){return this.j};kq.prototype.setTransform=function(b){gk(b,this.c)||(Qi(this.target,b),Dd(this.c,b))};function lq(b){this.j=Mi();var c=this.j.canvas;c.style.maxWidth="none";c.style.position="absolute";hq.call(this,b,c);this.c=!1;this.v=-1;this.B=NaN;this.o=Ld();this.b=this.G=null;this.O=Ad();this.D=Ad()}z(lq,hq);
lq.prototype.l=function(b,c){var d=b.viewState,e=d.center,f=d.rotation,g=d.resolution,d=b.pixelRatio,h=b.size[0],k=b.size[1],m=h*d,n=k*d,e=fk(this.O,d*h/2,d*k/2,d/g,-d/g,-f,-e[0],-e[1]),g=this.j;g.canvas.width=m;g.canvas.height=n;h=fk(this.D,0,0,1/d,1/d,0,-(m-h)/2*d,-(n-k)/2*d);Qi(g.canvas,h);mq(this,"precompose",b,e);(h=this.b)&&!h.Na()&&(g.globalAlpha=c.opacity,h.f(g,d,e,f,c.Db?b.skippedFeatureUids:{}),mq(this,"render",b,e));mq(this,"postcompose",b,e)};
function mq(b,c,d,e){var f=b.j;b=b.a;bd(b,c)&&(e=new lm(f,d.pixelRatio,d.extent,e,d.viewState.rotation),b.s(new ak(c,b,e,d,f,null)),ym(e))}lq.prototype.cb=function(b,c,d,e){if(this.b){var f=c.viewState.resolution,g=c.viewState.rotation,h=this.a,k=c.layerStates[w(h)],m={};return this.b.c(b,f,g,k.Db?c.skippedFeatureUids:{},function(b){var c=w(b).toString();if(!(c in m))return m[c]=!0,d.call(e,b,h)})}};lq.prototype.C=function(){jk(this)};
lq.prototype.i=function(b){function c(b){var c,e=b.cc();e?c=e.call(b,m):(e=d.b)&&(c=e(b,m));if(c){if(c){e=!1;if(ia(c))for(var f=0,g=c.length;f<g;++f)e=$m(p,b,c[f],Zm(m,n),this.C,this)||e;else e=$m(p,b,c,Zm(m,n),this.C,this)||e;b=e}else b=!1;this.c=this.c||b}}var d=this.a,e=d.ea();mk(b.attributions,e.i);nk(b,e);var f=b.viewHints[0],g=b.viewHints[1],h=d.j,k=d.l;if(!this.c&&!h&&f||!k&&g)return!0;var g=b.extent,h=b.viewState,f=h.projection,m=h.resolution,n=b.pixelRatio;b=d.f;k=d.a;h=km(d);void 0===h&&
(h=Ym);g=Pd(g,k*m);if(!this.c&&this.B==m&&this.v==b&&this.G==h&&Ud(this.o,g))return!0;qc(this.b);this.b=null;this.c=!1;var p=new Tm(.5*m/n,g,m,d.a);e.Oc(g,m,f);if(h){var q=[];e.rb(g,function(b){q.push(b)},this);q.sort(h);q.forEach(c,this)}else e.rb(g,c,this);Um(p);this.B=m;this.v=b;this.G=h;this.o=g;this.b=p;return!0};function nq(b,c){wk.call(this,0,c);this.b=Mi();var d=this.b.canvas;d.style.position="absolute";d.style.width="100%";d.style.height="100%";d.className="ol-unselectable";Jg(b,d,0);this.g=Ad();this.a=document.createElement("DIV");this.a.className="ol-unselectable";d=this.a.style;d.position="absolute";d.width="100%";d.height="100%";D(this.a,"touchstart",uc);Jg(b,this.a,0);this.f=!0}z(nq,wk);nq.prototype.X=function(){Kg(this.a);nq.da.X.call(this)};
nq.prototype.kf=function(b){if(b instanceof Rl)b=new iq(b);else if(b instanceof H)b=new jq(b);else if(b instanceof J)b=new lq(b);else return null;return b};function oq(b,c,d){var e=b.i;if(bd(e,c)){var f=d.extent,g=d.pixelRatio,h=d.viewState,k=h.rotation,m=b.b,n=m.canvas;fk(b.g,n.width/2,n.height/2,g/h.resolution,-g/h.resolution,-h.rotation,-h.center[0],-h.center[1]);b=new lm(m,g,f,b.g,k);e.s(new ak(c,e,b,d,m,null));ym(b)}}nq.prototype.V=function(){return"dom"};
nq.prototype.Pe=function(b){if(b){var c=this.i;if(bd(c,"precompose")||bd(c,"postcompose")){var c=this.b.canvas,d=b.pixelRatio;c.width=b.size[0]*d;c.height=b.size[1]*d}oq(this,"precompose",b);c=b.layerStatesArray;ob(c);var d=b.viewState.resolution,e,f,g,h;e=0;for(f=c.length;e<f;++e)h=c[e],g=h.layer,g=zk(this,g),Jg(this.a,g.target,e),ck(h,d)&&"ready"==h.O?g.i(b,h)&&g.l(b,h):g.g();var c=b.layerStates,k;for(k in this.c)k in c||(g=this.c[k],Kg(g.target));this.f||(eh(this.a,!0),this.f=!0);xk(b);Ak(this,
b);b.postRenderFunctions.push(yk);oq(this,"postcompose",b)}else this.f&&(eh(this.a,!1),this.f=!1)};function pq(b){this.a=b}function qq(b){this.a=b}z(qq,pq);qq.prototype.V=function(){return 35632};function rq(b){this.a=b}z(rq,pq);rq.prototype.V=function(){return 35633};function sq(){this.a="precision mediump float;varying vec2 a;varying float b;uniform float k;uniform sampler2D l;void main(void){vec4 texColor=texture2D(l,a);gl_FragColor.rgb=texColor.rgb;float alpha=texColor.a*b*k;if(alpha==0.0){discard;}gl_FragColor.a=alpha;}"}z(sq,qq);ea(sq);
function tq(){this.a="varying vec2 a;varying float b;attribute vec2 c;attribute vec2 d;attribute vec2 e;attribute float f;attribute float g;uniform mat4 h;uniform mat4 i;uniform mat4 j;void main(void){mat4 offsetMatrix=i;if(g==1.0){offsetMatrix=i*j;}vec4 offsets=offsetMatrix*vec4(e,0.,0.);gl_Position=h*vec4(c,0.,1.)+offsets;a=d;b=f;}"}z(tq,rq);ea(tq);
function uq(b,c){this.l=b.getUniformLocation(c,"j");this.o=b.getUniformLocation(c,"i");this.i=b.getUniformLocation(c,"k");this.j=b.getUniformLocation(c,"h");this.a=b.getAttribLocation(c,"e");this.f=b.getAttribLocation(c,"f");this.c=b.getAttribLocation(c,"c");this.b=b.getAttribLocation(c,"g");this.g=b.getAttribLocation(c,"d")};function vq(b){this.a=void 0!==b?b:[]};function wq(b,c){this.G=b;this.a=c;this.f={};this.i={};this.g={};this.l=this.o=this.c=this.j=null;(this.b=ub(xa,"OES_element_index_uint"))&&c.getExtension("OES_element_index_uint");D(this.G,"webglcontextlost",this.Pn,!1,this);D(this.G,"webglcontextrestored",this.Qn,!1,this)}
function xq(b,c,d){var e=b.a,f=d.a,g=w(d);if(g in b.f)e.bindBuffer(c,b.f[g].buffer);else{var h=e.createBuffer();e.bindBuffer(c,h);var k;34962==c?k=new Float32Array(f):34963==c&&(k=b.b?new Uint32Array(f):new Uint16Array(f));e.bufferData(c,k,35044);b.f[g]={Hb:d,buffer:h}}}function yq(b,c){var d=b.a,e=w(c),f=b.f[e];d.isContextLost()||d.deleteBuffer(f.buffer);delete b.f[e]}l=wq.prototype;
l.X=function(){var b=this.a;b.isContextLost()||(Hb(this.f,function(c){b.deleteBuffer(c.buffer)}),Hb(this.g,function(c){b.deleteProgram(c)}),Hb(this.i,function(c){b.deleteShader(c)}),b.deleteFramebuffer(this.c),b.deleteRenderbuffer(this.l),b.deleteTexture(this.o))};l.On=function(){return this.a};
function zq(b){if(!b.c){var c=b.a,d=c.createFramebuffer();c.bindFramebuffer(c.FRAMEBUFFER,d);var e=Aq(c,1,1),f=c.createRenderbuffer();c.bindRenderbuffer(c.RENDERBUFFER,f);c.renderbufferStorage(c.RENDERBUFFER,c.DEPTH_COMPONENT16,1,1);c.framebufferTexture2D(c.FRAMEBUFFER,c.COLOR_ATTACHMENT0,c.TEXTURE_2D,e,0);c.framebufferRenderbuffer(c.FRAMEBUFFER,c.DEPTH_ATTACHMENT,c.RENDERBUFFER,f);c.bindTexture(c.TEXTURE_2D,null);c.bindRenderbuffer(c.RENDERBUFFER,null);c.bindFramebuffer(c.FRAMEBUFFER,null);b.c=d;
b.o=e;b.l=f}return b.c}function Bq(b,c){var d=w(c);if(d in b.i)return b.i[d];var e=b.a,f=e.createShader(c.V());e.shaderSource(f,c.a);e.compileShader(f);return b.i[d]=f}function Cq(b,c,d){var e=w(c)+"/"+w(d);if(e in b.g)return b.g[e];var f=b.a,g=f.createProgram();f.attachShader(g,Bq(b,c));f.attachShader(g,Bq(b,d));f.linkProgram(g);return b.g[e]=g}l.Pn=function(){Ob(this.f);Ob(this.i);Ob(this.g);this.l=this.o=this.c=this.j=null};l.Qn=function(){};
l.Je=function(b){if(b==this.j)return!1;this.a.useProgram(b);this.j=b;return!0};function Dq(b,c,d){var e=b.createTexture();b.bindTexture(b.TEXTURE_2D,e);b.texParameteri(b.TEXTURE_2D,b.TEXTURE_MAG_FILTER,b.LINEAR);b.texParameteri(b.TEXTURE_2D,b.TEXTURE_MIN_FILTER,b.LINEAR);void 0!==c&&b.texParameteri(3553,10242,c);void 0!==d&&b.texParameteri(3553,10243,d);return e}function Aq(b,c,d){var e=Dq(b,void 0,void 0);b.texImage2D(b.TEXTURE_2D,0,b.RGBA,c,d,0,b.RGBA,b.UNSIGNED_BYTE,null);return e}
function Eq(b,c){var d=Dq(b,33071,33071);b.texImage2D(b.TEXTURE_2D,0,b.RGBA,b.RGBA,b.UNSIGNED_BYTE,c);return d};function Fq(b,c){this.D=this.C=void 0;this.o=ke(c);this.v=[];this.i=[];this.pa=void 0;this.g=[];this.c=[];this.U=this.wa=void 0;this.f=[];this.O=this.l=null;this.T=void 0;this.jb=Cd();this.Fb=Cd();this.ha=this.Y=void 0;this.Gb=Cd();this.ib=this.qa=this.ia=void 0;this.xa=[];this.j=[];this.a=[];this.B=null;this.b=[];this.G=[];this.na=void 0}z(Fq,Zj);
function Gq(b,c){var d=b.B,e=b.l,f=b.xa,g=b.j,h=c.a;return function(){if(!h.isContextLost()){var b,m;b=0;for(m=f.length;b<m;++b)h.deleteTexture(f[b]);b=0;for(m=g.length;b<m;++b)h.deleteTexture(g[b])}yq(c,d);yq(c,e)}}
function Hq(b,c,d,e){var f=b.C,g=b.D,h=b.pa,k=b.wa,m=b.U,n=b.T,p=b.Y,q=b.ha,r=b.ia?1:0,t=b.qa,v=b.ib,x=b.na,C=Math.cos(t),t=Math.sin(t),A=b.f.length,y=b.a.length,B,M,K,E,P,fa;for(B=0;B<d;B+=e)P=c[B]-b.o[0],fa=c[B+1]-b.o[1],M=y/8,K=-v*f,E=-v*(h-g),b.a[y++]=P,b.a[y++]=fa,b.a[y++]=K*C-E*t,b.a[y++]=K*t+E*C,b.a[y++]=p/m,b.a[y++]=(q+h)/k,b.a[y++]=n,b.a[y++]=r,K=v*(x-f),E=-v*(h-g),b.a[y++]=P,b.a[y++]=fa,b.a[y++]=K*C-E*t,b.a[y++]=K*t+E*C,b.a[y++]=(p+x)/m,b.a[y++]=(q+h)/k,b.a[y++]=n,b.a[y++]=r,K=v*(x-f),E=
v*g,b.a[y++]=P,b.a[y++]=fa,b.a[y++]=K*C-E*t,b.a[y++]=K*t+E*C,b.a[y++]=(p+x)/m,b.a[y++]=q/k,b.a[y++]=n,b.a[y++]=r,K=-v*f,E=v*g,b.a[y++]=P,b.a[y++]=fa,b.a[y++]=K*C-E*t,b.a[y++]=K*t+E*C,b.a[y++]=p/m,b.a[y++]=q/k,b.a[y++]=n,b.a[y++]=r,b.f[A++]=M,b.f[A++]=M+1,b.f[A++]=M+2,b.f[A++]=M,b.f[A++]=M+2,b.f[A++]=M+3}Fq.prototype.Ib=function(b,c){this.b.push(this.f.length);this.G.push(c);var d=b.ja();Hq(this,d,d.length,b.sa())};
Fq.prototype.Jb=function(b,c){this.b.push(this.f.length);this.G.push(c);var d=b.ja();Hq(this,d,d.length,b.sa())};function Iq(b,c){var d=c.a;b.v.push(b.f.length);b.i.push(b.f.length);b.B=new vq(b.a);xq(c,34962,b.B);b.l=new vq(b.f);xq(c,34963,b.l);var e={};Jq(b.xa,b.g,e,d);Jq(b.j,b.c,e,d);b.C=void 0;b.D=void 0;b.pa=void 0;b.g=null;b.c=null;b.wa=void 0;b.U=void 0;b.f=null;b.T=void 0;b.Y=void 0;b.ha=void 0;b.ia=void 0;b.qa=void 0;b.ib=void 0;b.a=null;b.na=void 0}
function Jq(b,c,d,e){var f,g,h,k=c.length;for(h=0;h<k;++h)f=c[h],g=w(f).toString(),g in d?f=d[g]:(f=Eq(e,f),d[g]=f),b[h]=f}
function Kq(b,c,d,e,f,g,h,k,m,n,p){var q=c.a;xq(c,34962,b.B);xq(c,34963,b.l);var r=sq.Zb(),t=tq.Zb(),t=Cq(c,r,t);b.O?r=b.O:(r=new uq(q,t),b.O=r);c.Je(t);q.enableVertexAttribArray(r.c);q.vertexAttribPointer(r.c,2,5126,!1,32,0);q.enableVertexAttribArray(r.a);q.vertexAttribPointer(r.a,2,5126,!1,32,8);q.enableVertexAttribArray(r.g);q.vertexAttribPointer(r.g,2,5126,!1,32,16);q.enableVertexAttribArray(r.f);q.vertexAttribPointer(r.f,1,5126,!1,32,24);q.enableVertexAttribArray(r.b);q.vertexAttribPointer(r.b,
1,5126,!1,32,28);t=b.Gb;fk(t,0,0,2/(e*g[0]),2/(e*g[1]),-f,-(d[0]-b.o[0]),-(d[1]-b.o[1]));d=b.Fb;e=2/g[0];g=2/g[1];Ed(d);d[0]=e;d[5]=g;d[10]=1;d[15]=1;g=b.jb;Ed(g);0!==f&&Jd(g,-f);q.uniformMatrix4fv(r.j,!1,t);q.uniformMatrix4fv(r.o,!1,d);q.uniformMatrix4fv(r.l,!1,g);q.uniform1f(r.i,h);var v;if(void 0===m)Lq(b,q,c,k,b.xa,b.v);else{if(n)a:{f=c.b?5125:5123;c=c.b?4:2;g=b.b.length-1;for(h=b.j.length-1;0<=h;--h)for(q.bindTexture(3553,b.j[h]),n=0<h?b.i[h-1]:0,t=b.i[h];0<=g&&b.b[g]>=n;){v=b.b[g];d=b.G[g];
e=w(d).toString();if(void 0===k[e]&&d.W()&&(void 0===p||ne(p,d.W().J()))&&(q.clear(q.COLOR_BUFFER_BIT|q.DEPTH_BUFFER_BIT),q.drawElements(4,t-v,f,v*c),t=m(d))){b=t;break a}t=v;g--}b=void 0}else q.clear(q.COLOR_BUFFER_BIT|q.DEPTH_BUFFER_BIT),Lq(b,q,c,k,b.j,b.i),b=(b=m(null))?b:void 0;v=b}q.disableVertexAttribArray(r.c);q.disableVertexAttribArray(r.a);q.disableVertexAttribArray(r.g);q.disableVertexAttribArray(r.f);q.disableVertexAttribArray(r.b);return v}
function Lq(b,c,d,e,f,g){var h=d.b?5125:5123;d=d.b?4:2;if(Nb(e)){var k;b=0;e=f.length;for(k=0;b<e;++b){c.bindTexture(3553,f[b]);var m=g[b];c.drawElements(4,m-k,h,k*d);k=m}}else{k=0;var n,m=0;for(n=f.length;m<n;++m){c.bindTexture(3553,f[m]);for(var p=0<m?g[m-1]:0,q=g[m],r=p;k<b.b.length&&b.b[k]<=q;){var t=w(b.G[k]).toString();void 0!==e[t]?(r!==p&&c.drawElements(4,p-r,h,r*d),p=r=k===b.b.length-1?q:b.b[k+1]):p=k===b.b.length-1?q:b.b[k+1];k++}r!==p&&c.drawElements(4,p-r,h,r*d)}}}
Fq.prototype.wb=function(b){var c=b.Yb(),d=b.hc(1),e=b.td(),f=b.Ce(1),g=b.B,h=b.Ea(),k=b.C,m=b.G,n=b.Eb();b=b.j;var p;0===this.g.length?this.g.push(d):(p=this.g[this.g.length-1],w(p)!=w(d)&&(this.v.push(this.f.length),this.g.push(d)));0===this.c.length?this.c.push(f):(p=this.c[this.c.length-1],w(p)!=w(f)&&(this.i.push(this.f.length),this.c.push(f)));this.C=c[0];this.D=c[1];this.pa=n[1];this.wa=e[1];this.U=e[0];this.T=g;this.Y=h[0];this.ha=h[1];this.qa=m;this.ia=k;this.ib=b;this.na=n[0]};
function Mq(b,c,d){this.i=c;this.j=b;this.g=d;this.b={}}function Nq(b,c){var d=[],e;for(e in b.b)d.push(Gq(b.b[e],c));return we.apply(null,d)}function Oq(b,c){for(var d in b.b)Iq(b.b[d],c)}Mq.prototype.a=function(b,c){var d=this.b[c];void 0===d&&(d=new Pq[c](this.j,this.i),this.b[c]=d);return d};Mq.prototype.Na=function(){return Nb(this.b)};Mq.prototype.f=function(b,c,d,e,f,g,h,k){var m,n;g=0;for(m=Em.length;g<m;++g)n=this.b[Em[g]],void 0!==n&&Kq(n,b,c,d,e,f,h,k,void 0,!1)};
function Qq(b,c,d,e,f,g,h,k,m,n){var p=Rq,q,r;for(q=Em.length-1;0<=q;--q)if(r=b.b[Em[q]],void 0!==r&&(r=Kq(r,c,d,e,f,p,g,h,k,m,n)))return r}Mq.prototype.c=function(b,c,d,e,f,g,h,k,m,n){var p=c.a;p.bindFramebuffer(p.FRAMEBUFFER,zq(c));var q;void 0!==this.g&&(q=Pd(Wd(b),e*this.g));return Qq(this,c,b,e,f,k,m,function(b){var c=new Uint8Array(4);p.readPixels(0,0,1,1,p.RGBA,p.UNSIGNED_BYTE,c);if(0<c[3]&&(b=n(b)))return b},!0,q)};
function Sq(b,c,d,e,f,g,h){var k=d.a;k.bindFramebuffer(k.FRAMEBUFFER,zq(d));return void 0!==Qq(b,d,c,e,f,g,h,function(){var b=new Uint8Array(4);k.readPixels(0,0,1,1,k.RGBA,k.UNSIGNED_BYTE,b);return 0<b[3]},!1)}var Pq={Image:Fq},Rq=[1,1];function Tq(b,c,d,e,f,g){this.f=b;this.g=c;this.c=g;this.l=f;this.j=e;this.i=d;this.b=null;this.a={}}z(Tq,Zj);l=Tq.prototype;l.pd=function(b,c){var d=b.toString(),e=this.a[d];void 0!==e?e.push(c):this.a[d]=[c]};l.Jc=function(){};l.lf=function(b,c){var d=(0,c.c)(b);if(d&&ne(this.c,d.J())){var e=c.a;void 0===e&&(e=0);this.pd(e,function(b){b.eb(c.g,c.b);b.wb(c.f);b.fb(c.Da());var e=Uq[d.V()];e&&e.call(b,d,null)})}};
l.Zd=function(b,c){var d=b.c,e,f;e=0;for(f=d.length;e<f;++e){var g=d[e],h=Uq[g.V()];h&&h.call(this,g,c)}};l.Jb=function(b,c){var d=this.f,e=(new Mq(1,this.c)).a(0,"Image");e.wb(this.b);e.Jb(b,c);Iq(e,d);Kq(e,this.f,this.g,this.i,this.j,this.l,1,{},void 0,!1);Gq(e,d)()};l.Xb=function(){};l.Kc=function(){};l.Ib=function(b,c){var d=this.f,e=(new Mq(1,this.c)).a(0,"Image");e.wb(this.b);e.Ib(b,c);Iq(e,d);Kq(e,this.f,this.g,this.i,this.j,this.l,1,{},void 0,!1);Gq(e,d)()};l.Lc=function(){};l.Mc=function(){};
l.Kb=function(){};l.eb=function(){};l.wb=function(b){this.b=b};l.fb=function(){};var Uq={Point:Tq.prototype.Jb,MultiPoint:Tq.prototype.Ib,GeometryCollection:Tq.prototype.Zd};function Vq(){this.a="precision mediump float;varying vec2 a;uniform float f;uniform sampler2D g;void main(void){vec4 texColor=texture2D(g,a);gl_FragColor.rgb=texColor.rgb;gl_FragColor.a=texColor.a*f;}"}z(Vq,qq);ea(Vq);function Wq(){this.a="varying vec2 a;attribute vec2 b;attribute vec2 c;uniform mat4 d;uniform mat4 e;void main(void){gl_Position=e*vec4(b,0.,1.);a=(d*vec4(c,0.,1.)).st;}"}z(Wq,rq);ea(Wq);
function Xq(b,c){this.b=b.getUniformLocation(c,"f");this.c=b.getUniformLocation(c,"e");this.i=b.getUniformLocation(c,"d");this.g=b.getUniformLocation(c,"g");this.a=b.getAttribLocation(c,"b");this.f=b.getAttribLocation(c,"c")};function Yq(b,c){ik.call(this,c);this.b=b;this.U=new vq([-1,-1,0,0,1,-1,1,0,-1,1,0,1,1,1,1,1]);this.g=this.ob=null;this.i=void 0;this.o=Ad();this.B=Cd();this.G=null}z(Yq,ik);
function Zq(b,c,d){var e=b.b.b;if(void 0===b.i||b.i!=d){c.postRenderFunctions.push(ua(function(b,c,d){b.isContextLost()||(b.deleteFramebuffer(c),b.deleteTexture(d))},e,b.g,b.ob));c=Aq(e,d,d);var f=e.createFramebuffer();e.bindFramebuffer(36160,f);e.framebufferTexture2D(36160,36064,3553,c,0);b.ob=c;b.g=f;b.i=d}else e.bindFramebuffer(36160,b.g)}
Yq.prototype.th=function(b,c,d){$q(this,"precompose",d,b);xq(d,34962,this.U);var e=d.a,f=Vq.Zb(),g=Wq.Zb(),f=Cq(d,f,g);this.G?g=this.G:this.G=g=new Xq(e,f);d.Je(f)&&(e.enableVertexAttribArray(g.a),e.vertexAttribPointer(g.a,2,5126,!1,16,0),e.enableVertexAttribArray(g.f),e.vertexAttribPointer(g.f,2,5126,!1,16,8),e.uniform1i(g.g,0));e.uniformMatrix4fv(g.i,!1,this.o);e.uniformMatrix4fv(g.c,!1,this.B);e.uniform1f(g.b,c.opacity);e.bindTexture(3553,this.ob);e.drawArrays(5,0,4);$q(this,"postcompose",d,b)};
function $q(b,c,d,e){b=b.a;if(bd(b,c)){var f=e.viewState;b.s(new ak(c,b,new Tq(d,f.center,f.resolution,f.rotation,e.size,e.extent),e,null,d))}}Yq.prototype.Gf=function(){this.g=this.ob=null;this.i=void 0};function ar(b,c){Yq.call(this,b,c);this.l=this.j=this.c=null}z(ar,Yq);function br(b,c){var d=c.a();return Eq(b.b.b,d)}ar.prototype.cb=function(b,c,d,e){var f=this.a;return f.ea().Ae(b,c.viewState.resolution,c.viewState.rotation,c.skippedFeatureUids,function(b){return d.call(e,b,f)})};
ar.prototype.Hf=function(b,c){var d=this.b.b,e=b.pixelRatio,f=b.viewState,g=f.center,h=f.resolution,k=f.rotation,m=this.c,n=this.ob,p=this.a.ea(),q=b.viewHints,r=b.extent;void 0!==c.extent&&(r=me(r,c.extent));q[0]||q[1]||he(r)||(f=p.C(r,h,e,f.projection))&&kk(this,f)&&(m=f,n=br(this,f),this.ob&&b.postRenderFunctions.push(ua(function(b,c){b.isContextLost()||b.deleteTexture(c)},d,this.ob)));m&&(d=this.b.g.G,cr(this,d.width,d.height,e,g,h,k,m.J()),this.l=null,e=this.o,Ed(e),Id(e,1,-1),Hd(e,0,-1),this.c=
m,this.ob=n,mk(b.attributions,m.i),nk(b,p));return!0};function cr(b,c,d,e,f,g,h,k){c*=g;d*=g;b=b.B;Ed(b);Id(b,2*e/c,2*e/d);Jd(b,-h);Hd(b,k[0]-f[0],k[1]-f[1]);Id(b,(k[2]-k[0])/2,(k[3]-k[1])/2);Hd(b,1,1)}ar.prototype.ze=function(b,c){return void 0!==this.cb(b,c,se,this)};
ar.prototype.zc=function(b,c,d,e){if(this.c&&this.c.a())if(this.a.ea()instanceof Rp){if(b=b.slice(),hk(c.pixelToCoordinateMatrix,b,b),this.cb(b,c,se,this))return d.call(e,this.a)}else{var f=[this.c.a().width,this.c.a().height];if(!this.l){var g=c.size;c=Ad();Ed(c);Hd(c,-1,-1);Id(c,2/g[0],2/g[1]);Hd(c,0,g[1]);Id(c,1,-1);g=Ad();Gd(this.B,g);var h=Ad();Ed(h);Hd(h,0,f[1]);Id(h,1,-1);Id(h,f[0]/2,f[1]/2);Hd(h,1,1);var k=Ad();Fd(h,g,k);Fd(k,c,k);this.l=k}c=[0,0];hk(this.l,b,c);if(!(0>c[0]||c[0]>f[0]||0>
c[1]||c[1]>f[1])&&(this.j||(this.j=Mi(1,1)),this.j.clearRect(0,0,1,1),this.j.drawImage(this.c.a(),c[0],c[1],1,1,0,0,1,1),0<this.j.getImageData(0,0,1,1).data[3]))return d.call(e,this.a)}};function dr(){this.a="precision mediump float;varying vec2 a;uniform sampler2D e;void main(void){gl_FragColor=texture2D(e,a);}"}z(dr,qq);ea(dr);function er(){this.a="varying vec2 a;attribute vec2 b;attribute vec2 c;uniform vec4 d;void main(void){gl_Position=vec4(b*d.xy+d.zw,0.,1.);a=c;}"}z(er,rq);ea(er);function fr(b,c){this.b=b.getUniformLocation(c,"e");this.c=b.getUniformLocation(c,"d");this.a=b.getAttribLocation(c,"b");this.f=b.getAttribLocation(c,"c")};function gr(b,c){Yq.call(this,b,c);this.D=dr.Zb();this.T=er.Zb();this.c=null;this.C=new vq([0,0,0,1,1,0,1,1,0,1,0,0,1,1,1,0]);this.v=this.j=null;this.l=-1;this.O=[0,0]}z(gr,Yq);l=gr.prototype;l.X=function(){yq(this.b.g,this.C);gr.da.X.call(this)};l.ed=function(b,c,d){var e=this.b;return function(f,g){return Mh(b,c,f,g,function(b){var c=oh(e.f,b.bb());c&&(d[f]||(d[f]={}),d[f][b.ga.toString()]=b);return c})}};l.Gf=function(){gr.da.Gf.call(this);this.c=null};
l.Hf=function(b,c,d){var e=this.b,f=d.a,g=b.viewState,h=g.projection,k=this.a,m=k.ea(),n=m.kb(h),p=Gh(n,g.resolution),q=n.$(p),r=Nh(m,p,b.pixelRatio,h),t=r[0]/ld(n.Ma(p),this.O)[0],v=q/t,x=m.ce(),C=g.center,A;q==g.resolution?(C=pk(C,q,b.size),A=le(C,q,g.rotation,b.size)):A=b.extent;q=Dh(n,A,q);if(this.j&&gg(this.j,q)&&this.l==m.f)v=this.v;else{var y=[ig(q),hg(q)],B=Math.pow(2,Math.ceil(Math.log(Math.max(y[0]*r[0],y[1]*r[1]))/Math.LN2)),y=v*B,M=n.Ea(p),K=M[0]+q.a*r[0]*v,v=M[1]+q.f*r[1]*v,v=[K,v,K+
y,v+y];Zq(this,b,B);f.viewport(0,0,B,B);f.clearColor(0,0,0,0);f.clear(16384);f.disable(3042);B=Cq(d,this.D,this.T);d.Je(B);this.c||(this.c=new fr(f,B));xq(d,34962,this.C);f.enableVertexAttribArray(this.c.a);f.vertexAttribPointer(this.c.a,2,5126,!1,16,0);f.enableVertexAttribArray(this.c.f);f.vertexAttribPointer(this.c.f,2,5126,!1,16,8);f.uniform1i(this.c.b,0);d={};d[p]={};var E=this.ed(m,h,d),P=k.b(),B=!0,K=Ld(),fa=new cg(0,0,0,0),I,ga,Ja;for(ga=q.a;ga<=q.c;++ga)for(Ja=q.f;Ja<=q.b;++Ja){M=m.Qb(p,ga,
Ja,t,h);if(void 0!==c.extent&&(I=n.Ba(M.ga,K),!ne(I,c.extent)))continue;I=M.state;I=2==I||4==I||3==I&&!P;!I&&M.a&&(M=M.a);I=M.state;if(2==I){if(oh(e.f,M.bb())){d[p][M.ga.toString()]=M;continue}}else if(4==I||3==I&&!P)continue;B=!1;I=Ah(n,M.ga,E,fa,K);I||(M=Ch(n,M.ga,fa,K))&&E(p+1,M)}c=Object.keys(d).map(Number);c.sort(tb);for(var E=new Float32Array(4),Sa,R,ja,P=0,fa=c.length;P<fa;++P)for(Sa in R=d[c[P]],R)M=R[Sa],I=n.Ba(M.ga,K),ga=2*(I[2]-I[0])/y,Ja=2*(I[3]-I[1])/y,ja=2*(I[0]-v[0])/y-1,I=2*(I[1]-
v[1])/y-1,zd(E,ga,Ja,ja,I),f.uniform4fv(this.c.c,E),hr(e,M,r,x*t),f.drawArrays(5,0,4);B?(this.j=q,this.v=v,this.l=m.f):(this.v=this.j=null,this.l=-1,b.animate=!0)}ok(b.usedTiles,m,p,q);var sc=e.l;qk(b,m,n,t,h,A,p,k.a(),function(b){var c;(c=2!=b.state||oh(e.f,b.bb()))||(c=b.bb()in sc.b);c||sc.c([b,Fh(n,b.ga),n.$(b.ga[0]),r,x*t])},this);lk(b,m);nk(b,m);f=this.o;Ed(f);Hd(f,(C[0]-v[0])/(v[2]-v[0]),(C[1]-v[1])/(v[3]-v[1]));0!==g.rotation&&Jd(f,g.rotation);Id(f,b.size[0]*g.resolution/(v[2]-v[0]),b.size[1]*
g.resolution/(v[3]-v[1]));Hd(f,-.5,-.5);return!0};l.zc=function(b,c,d,e){if(this.g){var f=[0,0];hk(this.o,[b[0]/c.size[0],(c.size[1]-b[1])/c.size[1]],f);b=[f[0]*this.i,f[1]*this.i];c=this.b.g.a;c.bindFramebuffer(c.FRAMEBUFFER,this.g);f=new Uint8Array(4);c.readPixels(b[0],b[1],1,1,c.RGBA,c.UNSIGNED_BYTE,f);if(0<f[3])return d.call(e,this.a)}};function ir(b,c){Yq.call(this,b,c);this.l=!1;this.O=-1;this.D=NaN;this.v=Ld();this.j=this.c=this.C=null}z(ir,Yq);l=ir.prototype;l.th=function(b,c,d){this.j=c;var e=b.viewState,f=this.c;f&&!f.Na()&&f.f(d,e.center,e.resolution,e.rotation,b.size,b.pixelRatio,c.opacity,c.Db?b.skippedFeatureUids:{})};l.X=function(){var b=this.c;b&&(Nq(b,this.b.g)(),this.c=null);ir.da.X.call(this)};
l.cb=function(b,c,d,e){if(this.c&&this.j){var f=c.viewState,g=this.a,h=this.j,k={};return this.c.c(b,this.b.g,f.center,f.resolution,f.rotation,c.size,c.pixelRatio,h.opacity,h.Db?c.skippedFeatureUids:{},function(b){var c=w(b).toString();if(!(c in k))return k[c]=!0,d.call(e,b,g)})}};l.ze=function(b,c){if(this.c&&this.j){var d=c.viewState;return Sq(this.c,b,this.b.g,d.resolution,d.rotation,this.j.opacity,c.skippedFeatureUids)}return!1};
l.zc=function(b,c,d,e){b=b.slice();hk(c.pixelToCoordinateMatrix,b,b);if(this.ze(b,c))return d.call(e,this.a)};l.uh=function(){jk(this)};
l.Hf=function(b,c,d){function e(b){var c,d=b.cc();d?c=d.call(b,n):(d=f.b)&&(c=d(b,n));if(c){if(c){d=!1;if(ia(c))for(var e=0,g=c.length;e<g;++e)d=$m(r,b,c[e],Zm(n,p),this.uh,this)||d;else d=$m(r,b,c,Zm(n,p),this.uh,this)||d;b=d}else b=!1;this.l=this.l||b}}var f=this.a;c=f.ea();mk(b.attributions,c.i);nk(b,c);var g=b.viewHints[0],h=b.viewHints[1],k=f.j,m=f.l;if(!this.l&&!k&&g||!m&&h)return!0;var h=b.extent,k=b.viewState,g=k.projection,n=k.resolution,p=b.pixelRatio,k=f.f,q=f.a,m=km(f);void 0===m&&(m=
Ym);h=Pd(h,q*n);if(!this.l&&this.D==n&&this.O==k&&this.C==m&&Ud(this.v,h))return!0;this.c&&b.postRenderFunctions.push(Nq(this.c,d));this.l=!1;var r=new Mq(.5*n/p,h,f.a);c.Oc(h,n,g);if(m){var t=[];c.rb(h,function(b){t.push(b)},this);t.sort(m);t.forEach(e,this)}else c.rb(h,e,this);Oq(r,d);this.D=n;this.O=k;this.C=m;this.v=h;this.c=r;return!0};function jr(b,c){wk.call(this,0,c);this.a=document.createElement("CANVAS");this.a.style.width="100%";this.a.style.height="100%";this.a.className="ol-unselectable";Jg(b,this.a,0);this.v=this.C=0;this.D=Mi();this.o=!0;this.b=Si(this.a,{antialias:!0,depth:!1,failIfMajorPerformanceCaveat:!0,preserveDrawingBuffer:!1,stencil:!0});this.g=new wq(this.a,this.b);D(this.a,"webglcontextlost",this.Mm,!1,this);D(this.a,"webglcontextrestored",this.Nm,!1,this);this.f=new nh;this.B=null;this.l=new Bk(function(b){var c=
b[1];b=b[2];var f=c[0]-this.B[0],c=c[1]-this.B[1];return 65536*Math.log(b)+Math.sqrt(f*f+c*c)/b}.bind(this),function(b){return b[0].bb()});this.O=function(){if(!this.l.Na()){Fk(this.l);var b=Ck(this.l);hr(this,b[0],b[3],b[4])}return!1}.bind(this);this.j=0;kr(this)}z(jr,wk);
function hr(b,c,d,e){var f=b.b,g=c.bb();if(oh(b.f,g))b=b.f.get(g),f.bindTexture(3553,b.ob),9729!=b.Xg&&(f.texParameteri(3553,10240,9729),b.Xg=9729),9729!=b.Yg&&(f.texParameteri(3553,10240,9729),b.Yg=9729);else{var h=f.createTexture();f.bindTexture(3553,h);if(0<e){var k=b.D.canvas,m=b.D;b.C!==d[0]||b.v!==d[1]?(k.width=d[0],k.height=d[1],b.C=d[0],b.v=d[1]):m.clearRect(0,0,d[0],d[1]);m.drawImage(c.Ua(),e,e,d[0],d[1],0,0,d[0],d[1]);f.texImage2D(3553,0,6408,6408,5121,k)}else f.texImage2D(3553,0,6408,6408,
5121,c.Ua());f.texParameteri(3553,10240,9729);f.texParameteri(3553,10241,9729);f.texParameteri(3553,10242,33071);f.texParameteri(3553,10243,33071);b.f.set(g,{ob:h,Xg:9729,Yg:9729})}}l=jr.prototype;l.kf=function(b){return b instanceof Rl?new ar(this,b):b instanceof H?new gr(this,b):b instanceof J?new ir(this,b):null};
function lr(b,c,d){var e=b.i;if(bd(e,c)){var f=b.g;b=d.viewState;b=new Tq(f,b.center,b.resolution,b.rotation,d.size,d.extent);e.s(new ak(c,e,b,d,null,f));c=Object.keys(b.a).map(Number);c.sort(tb);var g,h;d=0;for(e=c.length;d<e;++d)for(f=b.a[c[d].toString()],g=0,h=f.length;g<h;++g)f[g](b)}}l.X=function(){var b=this.b;b.isContextLost()||this.f.forEach(function(c){c&&b.deleteTexture(c.ob)});qc(this.g);jr.da.X.call(this)};
l.Dj=function(b,c){for(var d=this.b,e;1024<this.f.sc()-this.j;){if(e=this.f.a.nc)d.deleteTexture(e.ob);else if(+this.f.a.qe==c.index)break;else--this.j;this.f.pop()}};l.V=function(){return"webgl"};l.Mm=function(b){b.preventDefault();this.f.clear();this.j=0;Hb(this.c,function(b){b.Gf()})};l.Nm=function(){kr(this);this.i.render()};function kr(b){b=b.b;b.activeTexture(33984);b.blendFuncSeparate(770,771,1,771);b.disable(2884);b.disable(2929);b.disable(3089);b.disable(2960)}
l.Pe=function(b){var c=this.g,d=this.b;if(d.isContextLost())return!1;if(!b)return this.o&&(eh(this.a,!1),this.o=!1),!1;this.B=b.focus;this.f.set((-b.index).toString(),null);++this.j;lr(this,"precompose",b);var e=[],f=b.layerStatesArray;ob(f);var g=b.viewState.resolution,h,k,m,n;h=0;for(k=f.length;h<k;++h)n=f[h],ck(n,g)&&"ready"==n.O&&(m=zk(this,n.layer),m.Hf(b,n,c)&&e.push(n));f=b.size[0]*b.pixelRatio;g=b.size[1]*b.pixelRatio;if(this.a.width!=f||this.a.height!=g)this.a.width=f,this.a.height=g;d.bindFramebuffer(36160,
null);d.clearColor(0,0,0,0);d.clear(16384);d.enable(3042);d.viewport(0,0,this.a.width,this.a.height);h=0;for(k=e.length;h<k;++h)n=e[h],m=zk(this,n.layer),m.th(b,n,c);this.o||(eh(this.a,!0),this.o=!0);xk(b);1024<this.f.sc()-this.j&&b.postRenderFunctions.push(this.Dj.bind(this));this.l.Na()||(b.postRenderFunctions.push(this.O),b.animate=!0);lr(this,"postcompose",b);Ak(this,b);b.postRenderFunctions.push(yk)};
l.Ff=function(b,c,d,e,f,g){var h;if(this.b.isContextLost())return!1;var k=c.viewState,m=c.layerStatesArray,n;for(n=m.length-1;0<=n;--n){h=m[n];var p=h.layer;if(ck(h,k.resolution)&&f.call(g,p)&&(h=zk(this,p).cb(b,c,d,e)))return h}};l.sh=function(b,c,d,e){var f=!1;if(this.b.isContextLost())return!1;var g=c.viewState,h=c.layerStatesArray,k;for(k=h.length-1;0<=k;--k){var m=h[k],n=m.layer;if(ck(m,g.resolution)&&d.call(e,n)&&(f=zk(this,n).ze(b,c)))return!0}return f};
l.rh=function(b,c,d,e,f){if(this.b.isContextLost())return!1;var g=c.viewState,h,k=c.layerStatesArray,m;for(m=k.length-1;0<=m;--m){h=k[m];var n=h.layer;if(ck(h,g.resolution)&&f.call(e,n)&&(h=zk(this,n).zc(b,c,d,e)))return h}};var mr=["canvas","webgl","dom"];
function T(b){fd.call(this);var c=nr(b);this.oc=void 0!==b.loadTilesWhileAnimating?b.loadTilesWhileAnimating:!1;this.Gc=void 0!==b.loadTilesWhileInteracting?b.loadTilesWhileInteracting:!1;this.Ze=void 0!==b.pixelRatio?b.pixelRatio:Ui;this.$c=c.logos;this.v=new fi(this.Mo,void 0,this);pc(this,this.v);this.Fb=Ad();this.$e=Ad();this.Gb=0;this.b=null;this.xa=Ld();this.D=this.U=null;this.a=document.createElement("DIV");this.a.className="ol-viewport";this.a.style.position="relative";this.a.style.overflow=
"hidden";this.a.style.width="100%";this.a.style.height="100%";this.a.style.msTouchAction="none";this.a.style.touchAction="none";Zi&&Sg(this.a,"ol-touch");this.l=document.createElement("DIV");this.l.className="ol-overlaycontainer";this.a.appendChild(this.l);this.j=document.createElement("DIV");this.j.className="ol-overlaycontainer-stopevent";D(this.j,["click","dblclick","mousedown","touchstart","MSPointerDown",Tj,Yb?"DOMMouseScroll":"mousewheel"],tc);this.a.appendChild(this.j);b=new Lj(this);D(b,Kb(Wj),
this.Pg,!1,this);pc(this,b);this.ia=c.keyboardEventTarget;this.C=new xi;D(this.C,"key",this.Og,!1,this);pc(this,this.C);b=new Fi(this.a);D(b,"mousewheel",this.Og,!1,this);pc(this,b);this.g=c.controls;this.c=c.interactions;this.i=c.overlays;this.Y={};this.o=new c.Oo(this.a,this);pc(this,this.o);this.jb=new si;pc(this,this.jb);this.T=this.B=null;this.O=[];this.na=[];this.qa=new Gk(this.wk.bind(this),this.fl.bind(this));this.ha={};D(this,hd("layergroup"),this.Kk,!1,this);D(this,hd("view"),this.hl,!1,
this);D(this,hd("size"),this.cl,!1,this);D(this,hd("target"),this.el,!1,this);this.I(c.values);this.g.forEach(function(b){b.setMap(this)},this);D(this.g,"add",function(b){b.element.setMap(this)},!1,this);D(this.g,"remove",function(b){b.element.setMap(null)},!1,this);this.c.forEach(function(b){b.setMap(this)},this);D(this.c,"add",function(b){b.element.setMap(this)},!1,this);D(this.c,"remove",function(b){b.element.setMap(null)},!1,this);this.i.forEach(this.qg,this);D(this.i,"add",function(b){this.qg(b.element)},
!1,this);D(this.i,"remove",function(b){var c=b.element.Qa();void 0!==c&&delete this.Y[c.toString()];b.element.setMap(null)},!1,this)}z(T,fd);l=T.prototype;l.qj=function(b){this.g.push(b)};l.rj=function(b){this.c.push(b)};l.og=function(b){this.tc().Rc().push(b)};l.pg=function(b){this.i.push(b)};l.qg=function(b){var c=b.Qa();void 0!==c&&(this.Y[c.toString()]=b);b.setMap(this)};l.Pa=function(b){this.render();Array.prototype.push.apply(this.O,arguments)};l.X=function(){Kg(this.a);T.da.X.call(this)};
l.rd=function(b,c,d,e,f){if(this.b)return b=this.Ia(b),this.o.Ff(b,this.b,c,void 0!==d?d:null,void 0!==e?e:se,void 0!==f?f:null)};l.Rl=function(b,c,d,e,f){if(this.b)return this.o.rh(b,this.b,c,void 0!==d?d:null,void 0!==e?e:se,void 0!==f?f:null)};l.jl=function(b,c,d){if(!this.b)return!1;b=this.Ia(b);return this.o.sh(b,this.b,void 0!==c?c:se,void 0!==d?d:null)};l.Sj=function(b){return this.Ia(this.be(b))};l.be=function(b){var c;c=this.a;b=bh(b);c=bh(c);c=new wg(b.x-c.x,b.y-c.y);return[c.x,c.y]};
l.fh=function(){return this.get("target")};l.uc=function(){var b=this.fh();return void 0!==b?Bg(b):null};l.Ia=function(b){var c=this.b;return c?(b=b.slice(),hk(c.pixelToCoordinateMatrix,b,b)):null};l.Qj=function(){return this.g};l.jk=function(){return this.i};l.ik=function(b){b=this.Y[b.toString()];return void 0!==b?b:null};l.Xj=function(){return this.c};l.tc=function(){return this.get("layergroup")};l.eh=function(){return this.tc().Rc()};
l.Ra=function(b){var c=this.b;return c?(b=b.slice(0,2),hk(c.coordinateToPixelMatrix,b,b)):null};l.Ta=function(){return this.get("size")};l.aa=function(){return this.get("view")};l.yk=function(){return this.a};l.wk=function(b,c,d,e){var f=this.b;if(!(f&&c in f.wantedTiles&&f.wantedTiles[c][b.ga.toString()]))return Infinity;b=d[0]-f.focus[0];d=d[1]-f.focus[1];return 65536*Math.log(e)+Math.sqrt(b*b+d*d)/e};l.Og=function(b,c){var d=new Jj(c||b.type,this,b);this.Pg(d)};
l.Pg=function(b){if(this.b){this.T=b.coordinate;b.frameState=this.b;var c=this.c.a,d;if(!1!==this.s(b))for(d=c.length-1;0<=d;d--){var e=c[d];if(e.b()&&!e.handleEvent(b))break}}};l.$k=function(){var b=this.b,c=this.qa;if(!c.Na()){var d=16,e=d,f=0;b&&(f=b.viewHints,f[0]&&(d=this.oc?8:0,e=2),f[1]&&(d=this.Gc?8:0,e=2),f=Jb(b.wantedTiles));d*=f;e*=f;c.g<d&&(Fk(c),Hk(c,d,e))}c=this.na;d=0;for(e=c.length;d<e;++d)c[d](this,b);c.length=0};l.cl=function(){this.render()};
l.el=function(){var b=this.uc();Ei(this.C);b?(b.appendChild(this.a),yi(this.C,this.ia?this.ia:b),this.B||(this.B=D(this.jb,"resize",this.Xc,!1,this))):(Kg(this.a),this.B&&(Wc(this.B),this.B=null));this.Xc()};l.fl=function(){this.render()};l.il=function(){this.render()};l.hl=function(){this.U&&(Wc(this.U),this.U=null);var b=this.aa();b&&(this.U=D(b,"propertychange",this.il,!1,this));this.render()};l.Lk=function(){this.render()};l.Mk=function(){this.render()};
l.Kk=function(){this.D&&(this.D.forEach(Wc),this.D=null);var b=this.tc();b&&(this.D=[D(b,"propertychange",this.Mk,!1,this),D(b,"change",this.Lk,!1,this)]);this.render()};l.No=function(){var b=this.v;gi(b);b.c()};l.render=function(){null!=this.v.ya||this.v.start()};l.Go=function(b){return this.g.remove(b)};l.Ho=function(b){return this.c.remove(b)};l.Jo=function(b){return this.tc().Rc().remove(b)};l.Ko=function(b){return this.i.remove(b)};
l.Mo=function(b){var c,d,e,f=this.Ta(),g=this.aa(),h=null;if(void 0!==f&&0<f[0]&&0<f[1]&&g&&Rf(g)){var h=g.b.slice(),k=this.tc().sf(),m={};c=0;for(d=k.length;c<d;++c)m[w(k[c].layer)]=k[c];e=Qf(g);h={animate:!1,attributions:{},coordinateToPixelMatrix:this.Fb,extent:null,focus:this.T?this.T:e.center,index:this.Gb++,layerStates:m,layerStatesArray:k,logos:Rb(this.$c),pixelRatio:this.Ze,pixelToCoordinateMatrix:this.$e,postRenderFunctions:[],size:f,skippedFeatureUids:this.ha,tileQueue:this.qa,time:b,usedTiles:{},
viewState:e,viewHints:h,wantedTiles:{}}}if(h){b=this.O;c=f=0;for(d=b.length;c<d;++c)g=b[c],g(this,h)&&(b[f++]=g);b.length=f;h.extent=le(e.center,e.resolution,e.rotation,h.size)}this.b=h;this.o.Pe(h);h&&(h.animate&&this.render(),Array.prototype.push.apply(this.na,h.postRenderFunctions),0!==this.O.length||h.viewHints[0]||h.viewHints[1]||$d(h.extent,this.xa)||(this.s(new lh("moveend",this,h)),Qd(h.extent,this.xa)));this.s(new lh("postrender",this,h));ki(this.$k,this)};
l.gi=function(b){this.set("layergroup",b)};l.Zf=function(b){this.set("size",b)};l.Sl=function(b){this.set("target",b)};l.ap=function(b){this.set("view",b)};l.pi=function(b){b=w(b).toString();this.ha[b]=!0;this.render()};
l.Xc=function(){var b=this.uc();if(b){var c=Ag(b),d=Wb&&b.currentStyle;d&&Og(yg(c))&&"auto"!=d.width&&"auto"!=d.height&&!d.boxSizing?(c=fh(b,d.width,"width","pixelWidth"),b=fh(b,d.height,"height","pixelHeight"),b=new xg(c,b)):(d=new xg(b.offsetWidth,b.offsetHeight),c=hh(b,"padding"),b=kh(b),b=new xg(d.width-b.left-c.left-c.right-b.right,d.height-b.top-c.top-c.bottom-b.bottom));this.Zf([b.width,b.height])}else this.Zf(void 0)};l.ti=function(b){b=w(b).toString();delete this.ha[b];this.render()};
function nr(b){var c=null;void 0!==b.keyboardEventTarget&&(c=la(b.keyboardEventTarget)?document.getElementById(b.keyboardEventTarget):b.keyboardEventTarget);var d={},e={};if(void 0===b.logo||"boolean"==typeof b.logo&&b.logo)e["data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAACAAAAAgCAMAAABEpIrGAAAAA3NCSVQICAjb4U/gAAAACXBIWXMAAAHGAAABxgEXwfpGAAAAGXRFWHRTb2Z0d2FyZQB3d3cuaW5rc2NhcGUub3Jnm+48GgAAAhNQTFRF////AP//AICAgP//AFVVQECA////K1VVSbbbYL/fJ05idsTYJFtbbcjbJllmZszWWMTOIFhoHlNiZszTa9DdUcHNHlNlV8XRIVdiasrUHlZjIVZjaMnVH1RlIFRkH1RkH1ZlasvYasvXVsPQH1VkacnVa8vWIVZjIFRjVMPQa8rXIVVkXsXRsNveIFVkIFZlIVVj3eDeh6GmbMvXH1ZkIFRka8rWbMvXIFVkIFVjIFVkbMvWH1VjbMvWIFVlbcvWIFVla8vVIFVkbMvWbMvVH1VkbMvWIFVlbcvWIFVkbcvVbMvWjNPbIFVkU8LPwMzNIFVkbczWIFVkbsvWbMvXIFVkRnB8bcvW2+TkW8XRIFVkIlZlJVloJlpoKlxrLl9tMmJwOWd0Omh1RXF8TneCT3iDUHiDU8LPVMLPVcLPVcPQVsPPVsPQV8PQWMTQWsTQW8TQXMXSXsXRX4SNX8bSYMfTYcfTYsfTY8jUZcfSZsnUaIqTacrVasrVa8jTa8rWbI2VbMvWbcvWdJObdcvUdszUd8vVeJaee87Yfc3WgJyjhqGnitDYjaarldPZnrK2oNbborW5o9bbo9fbpLa6q9ndrL3ArtndscDDutzfu8fJwN7gwt7gxc/QyuHhy+HizeHi0NfX0+Pj19zb1+Tj2uXk29/e3uLg3+Lh3+bl4uXj4ufl4+fl5Ofl5ufl5ujm5+jmySDnBAAAAFp0Uk5TAAECAgMEBAYHCA0NDg4UGRogIiMmKSssLzU7PkJJT1JTVFliY2hrdHZ3foSFhYeJjY2QkpugqbG1tre5w8zQ09XY3uXn6+zx8vT09vf4+Pj5+fr6/P39/f3+gz7SsAAAAVVJREFUOMtjYKA7EBDnwCPLrObS1BRiLoJLnte6CQy8FLHLCzs2QUG4FjZ5GbcmBDDjxJBXDWxCBrb8aM4zbkIDzpLYnAcE9VXlJSWlZRU13koIeW57mGx5XjoMZEUqwxWYQaQbSzLSkYGfKFSe0QMsX5WbjgY0YS4MBplemI4BdGBW+DQ11eZiymfqQuXZIjqwyadPNoSZ4L+0FVM6e+oGI6g8a9iKNT3o8kVzNkzRg5lgl7p4wyRUL9Yt2jAxVh6mQCogae6GmflI8p0r13VFWTHBQ0rWPW7ahgWVcPm+9cuLoyy4kCJDzCm6d8PSFoh0zvQNC5OjDJhQopPPJqph1doJBUD5tnkbZiUEqaCnB3bTqLTFG1bPn71kw4b+GFdpLElKIzRxxgYgWNYc5SCENVHKeUaltHdXx0dZ8uBI1hJ2UUDgq82CM2MwKeibqAvSO7MCABq0wXEPiqWEAAAAAElFTkSuQmCC"]=
"http://openlayers.org/";else{var f=b.logo;la(f)?e[f]="":oa(f)&&(e[f.src]=f.href)}f=b.layers instanceof Hl?b.layers:new Hl({layers:b.layers});d.layergroup=f;d.target=b.target;d.view=void 0!==b.view?b.view:new Nf;var f=wk,g;void 0!==b.renderer?ia(b.renderer)?g=b.renderer:la(b.renderer)&&(g=[b.renderer]):g=mr;var h,k;h=0;for(k=g.length;h<k;++h){var m=g[h];if("canvas"==m){if(Wi){f=fq;break}}else if("dom"==m){f=nq;break}else if("webgl"==m&&Ti){f=jr;break}}var n;void 0!==b.controls?n=ia(b.controls)?new mg(b.controls.slice()):
b.controls:n=Wh();var p;void 0!==b.interactions?p=ia(b.interactions)?new mg(b.interactions.slice()):b.interactions:p=Gl();b=void 0!==b.overlays?ia(b.overlays)?new mg(b.overlays.slice()):b.overlays:new mg;return{controls:n,interactions:p,keyboardEventTarget:c,logos:e,overlays:b,Oo:f,values:d}}Ql();function or(b){fd.call(this);this.ya=b.id;this.j=void 0!==b.insertFirst?b.insertFirst:!0;this.l=void 0!==b.stopEvent?b.stopEvent:!0;this.b=document.createElement("DIV");this.b.className="ol-overlay-container";this.b.style.position="absolute";this.autoPan=void 0!==b.autoPan?b.autoPan:!1;this.g=void 0!==b.autoPanAnimation?b.autoPanAnimation:{};this.i=void 0!==b.autoPanMargin?b.autoPanMargin:20;this.a={Vd:"",re:"",Qe:"",Re:"",visible:!0};this.c=null;D(this,hd("element"),this.Hk,!1,this);D(this,hd("map"),
this.Rk,!1,this);D(this,hd("offset"),this.Wk,!1,this);D(this,hd("position"),this.Yk,!1,this);D(this,hd("positioning"),this.Zk,!1,this);void 0!==b.element&&this.ci(b.element);this.ii(void 0!==b.offset?b.offset:[0,0]);this.li(void 0!==b.positioning?b.positioning:"top-left");void 0!==b.position&&this.Cf(b.position)}z(or,fd);l=or.prototype;l.ue=function(){return this.get("element")};l.Qa=function(){return this.ya};l.ve=function(){return this.get("map")};l.Kg=function(){return this.get("offset")};
l.gh=function(){return this.get("position")};l.Lg=function(){return this.get("positioning")};l.Hk=function(){Ig(this.b);var b=this.ue();b&&this.b.appendChild(b)};l.Rk=function(){this.c&&(Kg(this.b),Wc(this.c),this.c=null);var b=this.ve();b&&(this.c=D(b,"postrender",this.render,!1,this),pr(this),b=this.l?b.j:b.l,this.j?Jg(b,this.b,0):b.appendChild(this.b))};l.render=function(){pr(this)};l.Wk=function(){pr(this)};
l.Yk=function(){pr(this);if(void 0!==this.get("position")&&this.autoPan){var b=this.ve();if(void 0!==b&&b.uc()){var c=qr(b.uc(),b.Ta()),d=this.ue(),e=d.offsetWidth,f=d.currentStyle||window.getComputedStyle(d),e=e+(parseInt(f.marginLeft,10)+parseInt(f.marginRight,10)),f=d.offsetHeight,g=d.currentStyle||window.getComputedStyle(d),f=f+(parseInt(g.marginTop,10)+parseInt(g.marginBottom,10)),h=qr(d,[e,f]),d=this.i;Ud(c,h)||(e=h[0]-c[0],f=c[2]-h[2],g=h[1]-c[1],h=c[3]-h[3],c=[0,0],0>e?c[0]=e-d:0>f&&(c[0]=
Math.abs(f)+d),0>g?c[1]=g-d:0>h&&(c[1]=Math.abs(h)+d),0===c[0]&&0===c[1])||(d=b.aa().Va(),e=b.Ra(d),c=[e[0]+c[0],e[1]+c[1]],this.g&&(this.g.source=d,b.Pa(Yf(this.g))),b.aa().mb(b.Ia(c)))}}};l.Zk=function(){pr(this)};l.ci=function(b){this.set("element",b)};l.setMap=function(b){this.set("map",b)};l.ii=function(b){this.set("offset",b)};l.Cf=function(b){this.set("position",b)};
function qr(b,c){var d=Ag(b),e=new wg(0,0),f;f=d?Ag(d):document;f=!Wb||9<=ic||Og(yg(f))?f.documentElement:f.body;b!=f&&(f=ah(b),d=Pg(yg(d)),e.x=f.left+d.x,e.y=f.top+d.y);return[e.x,e.y,e.x+c[0],e.y+c[1]]}l.li=function(b){this.set("positioning",b)};function rr(b,c){b.a.visible!==c&&(eh(b.b,c),b.a.visible=c)}
function pr(b){var c=b.ve(),d=b.gh();if(void 0!==c&&c.b&&void 0!==d){var d=c.Ra(d),e=c.Ta(),c=b.b.style,f=b.Kg(),g=b.Lg(),h=f[0],f=f[1];if("bottom-right"==g||"center-right"==g||"top-right"==g)""!==b.a.re&&(b.a.re=c.left=""),h=Math.round(e[0]-d[0]-h)+"px",b.a.Qe!=h&&(b.a.Qe=c.right=h);else{""!==b.a.Qe&&(b.a.Qe=c.right="");if("bottom-center"==g||"center-center"==g||"top-center"==g)h-=ch(b.b).width/2;h=Math.round(d[0]+h)+"px";b.a.re!=h&&(b.a.re=c.left=h)}if("bottom-left"==g||"bottom-center"==g||"bottom-right"==
g)""!==b.a.Re&&(b.a.Re=c.top=""),d=Math.round(e[1]-d[1]-f)+"px",b.a.Vd!=d&&(b.a.Vd=c.bottom=d);else{""!==b.a.Vd&&(b.a.Vd=c.bottom="");if("center-left"==g||"center-center"==g||"center-right"==g)f-=ch(b.b).height/2;d=Math.round(d[1]+f)+"px";b.a.Re!=d&&(b.a.Re=c.top=d)}rr(b,!0)}else rr(b,!1)};function sr(b){b=b?b:{};this.i=void 0!==b.collapsed?b.collapsed:!0;this.j=void 0!==b.collapsible?b.collapsible:!0;this.j||(this.i=!1);var c=b.className?b.className:"ol-overviewmap",d=b.tipLabel?b.tipLabel:"Overview map",e=b.collapseLabel?b.collapseLabel:"\u00ab";this.B=la(e)?Fg("SPAN",{},e):e;e=b.label?b.label:"\u00bb";this.v=la(e)?Fg("SPAN",{},e):e;d=Fg("BUTTON",{type:"button",title:d},this.j&&!this.i?this.B:this.v);D(d,"click",this.cm,!1,this);var e=Fg("DIV","ol-overviewmap-map"),f=this.b=new T({controls:new mg,
interactions:new mg,target:e,view:b.view});b.layers&&b.layers.forEach(function(b){f.og(b)},this);var g=Fg("DIV","ol-overviewmap-box");this.l=new or({position:[0,0],positioning:"bottom-left",element:g});this.b.pg(this.l);c=Fg("DIV",c+" ol-unselectable ol-control"+(this.i&&this.j?" ol-collapsed":"")+(this.j?"":" ol-uncollapsible"),e,d);mh.call(this,{element:c,render:b.render?b.render:tr,target:b.target})}z(sr,mh);l=sr.prototype;
l.setMap=function(b){var c=this.a;b!==c&&(c&&(c=c.aa())&&Vc(c,hd("rotation"),this.le,!1,this),sr.da.setMap.call(this,b),b&&(this.o.push(D(b,"propertychange",this.Sk,!1,this)),0===this.b.eh().bc()&&this.b.gi(b.tc()),b=b.aa()))&&(D(b,hd("rotation"),this.le,!1,this),Rf(b)&&(this.b.Xc(),ur(this)))};l.Sk=function(b){"view"===b.key&&((b=b.oldValue)&&Vc(b,hd("rotation"),this.le,!1,this),b=this.a.aa(),D(b,hd("rotation"),this.le,!1,this))};l.le=function(){this.b.aa().we(this.a.aa().Ha())};
function tr(){var b=this.a,c=this.b;if(b.b&&c.b){var d=b.Ta(),b=b.aa().bd(d),e=c.Ta(),d=c.aa().bd(e),f=c.Ra(fe(b)),c=c.Ra(de(b)),c=new xg(Math.abs(f[0]-c[0]),Math.abs(f[1]-c[1])),f=e[0],e=e[1];c.width<.1*f||c.height<.1*e||c.width>.75*f||c.height>.75*e?ur(this):Ud(d,b)||(b=this.b,d=this.a.aa(),b.aa().mb(d.Va()))}vr(this)}function ur(b){var c=b.a;b=b.b;var d=c.Ta(),c=c.aa().bd(d),d=b.Ta();b=b.aa();oe(c,1/(.1*Math.pow(2,Math.log(7.5)/Math.LN2/2)));b.mf(c,d)}
function vr(b){var c=b.a,d=b.b;if(c.b&&d.b){var e=c.Ta(),f=c.aa(),g=d.aa();d.Ta();var c=f.Ha(),h=b.l,d=b.l.ue(),f=f.bd(e),e=g.$(),g=ce(f),f=ee(f),k;if(b=b.a.aa().Va())k=[g[0]-b[0],g[1]-b[1]],td(k,c),od(k,b);h.Cf(k);d&&(k=new xg(Math.abs((g[0]-f[0])/e),Math.abs((f[1]-g[1])/e)),c=Og(yg(Ag(d))),!Wb||gc("10")||c&&gc("8")?(d=d.style,Yb?d.MozBoxSizing="border-box":Zb?d.WebkitBoxSizing="border-box":d.boxSizing="border-box",d.width=Math.max(k.width,0)+"px",d.height=Math.max(k.height,0)+"px"):(b=d.style,c?
(c=hh(d,"padding"),d=kh(d),b.pixelWidth=k.width-d.left-c.left-c.right-d.right,b.pixelHeight=k.height-d.top-c.top-c.bottom-d.bottom):(b.pixelWidth=k.width,b.pixelHeight=k.height)))}}l.cm=function(b){b.preventDefault();wr(this)};function wr(b){Ug(b.element,"ol-collapsed");b.i?Lg(b.B,b.v):Lg(b.v,b.B);b.i=!b.i;var c=b.b;b.i||c.b||(c.Xc(),ur(b),Uc(c,"postrender",function(){vr(this)},!1,b))}l.bm=function(){return this.j};
l.em=function(b){this.j!==b&&(this.j=b,Ug(this.element,"ol-uncollapsible"),!b&&this.i&&wr(this))};l.dm=function(b){this.j&&this.i!==b&&wr(this)};l.am=function(){return this.i};l.kk=function(){return this.b};function xr(b){b=b?b:{};var c=b.className?b.className:"ol-scale-line";this.j=Fg("DIV",c+"-inner");this.i=Fg("DIV",c+" ol-unselectable",this.j);this.B=null;this.l=void 0!==b.minWidth?b.minWidth:64;this.b=!1;this.D=void 0;this.v="";mh.call(this,{element:this.i,render:b.render?b.render:yr,target:b.target});D(this,hd("units"),this.T,!1,this);this.O(b.units||"metric")}z(xr,mh);var zr=[1,2,5];xr.prototype.C=function(){return this.get("units")};
function yr(b){(b=b.frameState)?this.B=b.viewState:this.B=null;Ar(this)}xr.prototype.T=function(){Ar(this)};xr.prototype.O=function(b){this.set("units",b)};
function Ar(b){var c=b.B;if(c){var d=c.projection,e=d.$b(),c=d.getPointResolution(c.resolution,c.center)*e,e=b.l*c,d="",f=b.C();"degrees"==f?(d=Ae.degrees,c/=d,e<d/60?(d="\u2033",c*=3600):e<d?(d="\u2032",c*=60):d="\u00b0"):"imperial"==f?.9144>e?(d="in",c/=.0254):1609.344>e?(d="ft",c/=.3048):(d="mi",c/=1609.344):"nautical"==f?(c/=1852,d="nm"):"metric"==f?1>e?(d="mm",c*=1E3):1E3>e?d="m":(d="km",c/=1E3):"us"==f&&(.9144>e?(d="in",c*=39.37):1609.344>e?(d="ft",c/=.30480061):(d="mi",c/=1609.3472));for(var f=
3*Math.floor(Math.log(b.l*c)/Math.log(10)),g;;){g=zr[(f%3+3)%3]*Math.pow(10,Math.floor(f/3));e=Math.round(g/c);if(isNaN(e)){eh(b.i,!1);b.b=!1;return}if(e>=b.l)break;++f}c=g+" "+d;b.v!=c&&(b.j.innerHTML=c,b.v=c);b.D!=e&&(b.j.style.width=e+"px",b.D=e);b.b||(eh(b.i,!0),b.b=!0)}else b.b&&(eh(b.i,!1),b.b=!1)};function Br(b){mc.call(this);this.f=b;this.a={}}z(Br,mc);var Cr=[];Br.prototype.Sa=function(b,c,d,e){ia(c)||(c&&(Cr[0]=c.toString()),c=Cr);for(var f=0;f<c.length;f++){var g=D(b,c[f],d||this.handleEvent,e||!1,this.f||this);if(!g)break;this.a[g.key]=g}return this};
Br.prototype.$f=function(b,c,d,e,f){if(ia(c))for(var g=0;g<c.length;g++)this.$f(b,c[g],d,e,f);else d=d||this.handleEvent,f=f||this.f||this,d=Oc(d),e=!!e,c=Bc(b)?Jc(b.Ab,String(c),d,e,f):b?(b=Qc(b))?Jc(b,c,d,e,f):null:null,c&&(Wc(c),delete this.a[c.key]);return this};function Dr(b){Hb(b.a,function(b,d){this.a.hasOwnProperty(d)&&Wc(b)},b);b.a={}}Br.prototype.X=function(){Br.da.X.call(this);Dr(this)};Br.prototype.handleEvent=function(){throw Error("EventHandler.handleEvent not implemented");};function Er(b,c,d){$c.call(this);this.target=b;this.handle=c||b;this.a=d||new Wg(NaN,NaN,NaN,NaN);this.i=Ag(b);this.f=new Br(this);pc(this,this.f);this.g=this.c=this.o=this.l=this.screenY=this.screenX=this.clientY=this.clientX=0;this.b=!1;D(this.handle,["touchstart","mousedown"],this.ri,!1,this)}z(Er,$c);var Fr=Wb||Yb&&gc("1.9.3");l=Er.prototype;
l.X=function(){Er.da.X.call(this);Vc(this.handle,["touchstart","mousedown"],this.ri,!1,this);Dr(this.f);Fr&&this.i.releaseCapture();this.handle=this.target=null};
l.ri=function(b){var c="mousedown"==b.type;if(this.b||c&&!yc(b))this.s("earlycancel");else if(this.s(new Gr("start",this,b.clientX,b.clientY))){this.b=!0;b.preventDefault();var c=this.i,d=c.documentElement,e=!Fr;this.f.Sa(c,["touchmove","mousemove"],this.Vk,e);this.f.Sa(c,["touchend","mouseup"],this.$d,e);Fr?(d.setCapture(!1),this.f.Sa(d,"losecapture",this.$d)):this.f.Sa(c?c.parentWindow||c.defaultView:window,"blur",this.$d);this.G&&this.f.Sa(this.G,"scroll",this.Vn,e);this.clientX=this.l=b.clientX;
this.clientY=this.o=b.clientY;this.screenX=b.screenX;this.screenY=b.screenY;this.c=this.target.offsetLeft;this.g=this.target.offsetTop;this.j=Pg(yg(this.i))}};l.$d=function(b){Dr(this.f);Fr&&this.i.releaseCapture();this.b?(this.b=!1,this.s(new Gr("end",this,b.clientX,b.clientY,0,Hr(this,this.c),Ir(this,this.g)))):this.s("earlycancel")};
l.Vk=function(b){var c=1*(b.clientX-this.clientX),d=b.clientY-this.clientY;this.clientX=b.clientX;this.clientY=b.clientY;this.screenX=b.screenX;this.screenY=b.screenY;if(!this.b){var e=this.l-this.clientX,f=this.o-this.clientY;if(0<e*e+f*f)if(this.s(new Gr("start",this,b.clientX,b.clientY)))this.b=!0;else{this.pa||this.$d(b);return}}d=Jr(this,c,d);c=d.x;d=d.y;this.b&&this.s(new Gr("beforedrag",this,b.clientX,b.clientY,0,c,d))&&(Kr(this,b,c,d),b.preventDefault())};
function Jr(b,c,d){var e=Pg(yg(b.i));c+=e.x-b.j.x;d+=e.y-b.j.y;b.j=e;b.c+=c;b.g+=d;return new wg(Hr(b,b.c),Ir(b,b.g))}l.Vn=function(b){var c=Jr(this,0,0);b.clientX=this.clientX;b.clientY=this.clientY;Kr(this,b,c.x,c.y)};function Kr(b,c,d,e){b.target.style.left=d+"px";b.target.style.top=e+"px";b.s(new Gr("drag",b,c.clientX,c.clientY,0,d,e))}function Hr(b,c){var d=b.a,e=isNaN(d.left)?null:d.left,d=isNaN(d.width)?0:d.width;return Math.min(null!=e?e+d:Infinity,Math.max(null!=e?e:-Infinity,c))}
function Ir(b,c){var d=b.a,e=isNaN(d.top)?null:d.top,d=isNaN(d.height)?0:d.height;return Math.min(null!=e?e+d:Infinity,Math.max(null!=e?e:-Infinity,c))}function Gr(b,c,d,e,f,g,h){rc.call(this,b);this.clientX=d;this.clientY=e;this.left=ca(g)?g:c.c;this.top=ca(h)?h:c.g}z(Gr,rc);function Lr(b){b=b?b:{};this.i=void 0;this.j=Mr;this.l=null;this.v=!1;this.B=void 0!==b.duration?b.duration:200;var c=b.className?b.className:"ol-zoomslider",d=Fg("BUTTON",{type:"button","class":c+"-thumb ol-unselectable"}),c=Fg("DIV",[c,"ol-unselectable","ol-control"],d);this.b=new Er(d);pc(this,this.b);D(this.b,"start",this.Gk,!1,this);D(this.b,"drag",this.Ek,!1,this);D(this.b,"end",this.Fk,!1,this);D(c,"click",this.Dk,!1,this);D(d,"click",tc);mh.call(this,{element:c,render:b.render?b.render:Nr})}
z(Lr,mh);var Mr=0;l=Lr.prototype;l.setMap=function(b){Lr.da.setMap.call(this,b);b&&b.render()};
function Nr(b){if(b.frameState){if(!this.v){var c=this.element,d=ch(c),e=Mg(c),c=hh(e,"margin"),f=new xg(e.offsetWidth,e.offsetHeight),e=f.width+c.right+c.left,c=f.height+c.top+c.bottom;this.l=[e,c];e=d.width-e;c=d.height-c;d.width>d.height?(this.j=1,d=new Wg(0,0,e,0)):(this.j=Mr,d=new Wg(0,0,0,c));this.b.a=d||new Wg(NaN,NaN,NaN,NaN);this.v=!0}b=b.frameState.viewState.resolution;b!==this.i&&(this.i=b,b=1-Pf(this.a.aa())(b),d=this.b,c=Mg(this.element),1==this.j?Zg(c,d.a.left+d.a.width*b):Zg(c,d.a.left,
d.a.top+d.a.height*b))}}l.Dk=function(b){var c=this.a,d=c.aa(),e=d.$();c.Pa($f({resolution:e,duration:this.B,easing:Uf}));b=Or(this,Pr(this,b.offsetX-this.l[0]/2,b.offsetY-this.l[1]/2));d.Vb(d.constrainResolution(b))};l.Gk=function(){Sf(this.a.aa(),1)};l.Ek=function(b){this.i=Or(this,Pr(this,b.left,b.top));this.a.aa().Vb(this.i)};l.Fk=function(){var b=this.a,c=b.aa();Sf(c,-1);b.Pa($f({resolution:this.i,duration:this.B,easing:Uf}));b=c.constrainResolution(this.i);c.Vb(b)};
function Pr(b,c,d){var e=b.b.a;return Ra(1===b.j?(c-e.left)/e.width:(d-e.top)/e.height,0,1)}function Or(b,c){return Of(b.a.aa())(1-c)};function Qr(b){b=b?b:{};this.b=b.extent?b.extent:null;var c=b.className?b.className:"ol-zoom-extent",d=Fg("BUTTON",{type:"button",title:b.tipLabel?b.tipLabel:"Fit to extent"},b.label?b.label:"E");D(d,"click",this.i,!1,this);c=Fg("DIV",c+" ol-unselectable ol-control",d);mh.call(this,{element:c,target:b.target})}z(Qr,mh);Qr.prototype.i=function(b){b.preventDefault();var c=this.a;b=c.aa();var d=this.b?this.b:b.g.J(),c=c.Ta();b.mf(d,c)};function Rr(b){fd.call(this);b=b?b:{};this.a=null;D(this,hd("tracking"),this.Gl,!1,this);this.Af(void 0!==b.tracking?b.tracking:!1)}z(Rr,fd);l=Rr.prototype;l.X=function(){this.Af(!1);Rr.da.X.call(this)};
l.Wn=function(b){b=b.a;if(null!==b.alpha){var c=Wa(b.alpha);this.set("alpha",c);"boolean"==typeof b.absolute&&b.absolute?this.set("heading",c):ma(b.webkitCompassHeading)&&-1!=b.webkitCompassAccuracy&&this.set("heading",Wa(b.webkitCompassHeading))}null!==b.beta&&this.set("beta",Wa(b.beta));null!==b.gamma&&this.set("gamma",Wa(b.gamma));this.u()};l.Lj=function(){return this.get("alpha")};l.Oj=function(){return this.get("beta")};l.Uj=function(){return this.get("gamma")};l.Fl=function(){return this.get("heading")};
l.$g=function(){return this.get("tracking")};l.Gl=function(){if(Xi){var b=this.$g();b&&!this.a?this.a=D(ba,"deviceorientation",this.Wn,!1,this):!b&&this.a&&(Wc(this.a),this.a=null)}};l.Af=function(b){this.set("tracking",b)};function Sr(){this.defaultDataProjection=null}function Tr(b,c,d){var e;d&&(e={dataProjection:d.dataProjection?d.dataProjection:b.Ka(c),featureProjection:d.featureProjection});return Ur(b,e)}function Ur(b,c){var d;c&&(d={featureProjection:c.featureProjection,dataProjection:c.dataProjection?c.dataProjection:b.defaultDataProjection,rightHanded:c.rightHanded});return d}
function Vr(b,c,d){var e=d?Ee(d.featureProjection):null;d=d?Ee(d.dataProjection):null;return e&&d&&!Ve(e,d)?b instanceof $e?(c?b.clone():b).nb(c?e:d,c?d:e):Ze(c?b.slice():b,c?e:d,c?d:e):b};function Wr(){this.defaultDataProjection=null}z(Wr,Sr);function Xr(b){return oa(b)?b:la(b)?(b=co(b))?b:null:null}l=Wr.prototype;l.V=function(){return"json"};l.Ub=function(b,c){return this.Tc(Xr(b),Tr(this,b,c))};l.Ca=function(b,c){return this.Of(Xr(b),Tr(this,b,c))};l.Uc=function(b,c){return this.Mh(Xr(b),Tr(this,b,c))};l.Ka=function(b){return this.Th(Xr(b))};l.Ld=function(b,c){return eo(this.Yc(b,c))};l.Wb=function(b,c){return eo(this.Ue(b,c))};l.Zc=function(b,c){return eo(this.We(b,c))};function Yr(b,c,d,e,f,g){var h=NaN,k=NaN,m=(d-c)/e;if(0!==m)if(1==m)h=b[c],k=b[c+1];else if(2==m)h=(1-f)*b[c]+f*b[c+e],k=(1-f)*b[c+1]+f*b[c+e+1];else{var k=b[c],m=b[c+1],n=0,h=[0],p;for(p=c+e;p<d;p+=e){var q=b[p],r=b[p+1],n=n+Math.sqrt((q-k)*(q-k)+(r-m)*(r-m));h.push(n);k=q;m=r}d=f*n;var t;f=nb;k=0;for(m=h.length;k<m;)n=k+m>>1,p=f(d,h[n]),0<p?k=n+1:(m=n,t=!p);t=t?k:~k;0>t?(d=(d-h[-t-2])/(h[-t-1]-h[-t-2]),c+=(-t-2)*e,h=nd(b[c],b[c+e],d),k=nd(b[c+1],b[c+e+1],d)):(h=b[c+t*e],k=b[c+t*e+1])}return g?(g[0]=
h,g[1]=k,g):[h,k]}function Zr(b,c,d,e,f,g){if(d==c)return null;if(f<b[c+e-1])return g?(d=b.slice(c,c+e),d[e-1]=f,d):null;if(b[d-1]<f)return g?(d=b.slice(d-e,d),d[e-1]=f,d):null;if(f==b[c+e-1])return b.slice(c,c+e);c/=e;for(d/=e;c<d;)g=c+d>>1,f<b[(g+1)*e-1]?d=g:c=g+1;d=b[c*e-1];if(f==d)return b.slice((c-1)*e,(c-1)*e+e);g=(f-d)/(b[(c+1)*e-1]-d);d=[];var h;for(h=0;h<e-1;++h)d.push(nd(b[(c-1)*e+h],b[c*e+h],g));d.push(f);return d}
function $r(b,c,d,e,f,g){var h=0;if(g)return Zr(b,h,c[c.length-1],d,e,f);if(e<b[d-1])return f?(b=b.slice(0,d),b[d-1]=e,b):null;if(b[b.length-1]<e)return f?(b=b.slice(b.length-d),b[d-1]=e,b):null;f=0;for(g=c.length;f<g;++f){var k=c[f];if(h!=k){if(e<b[h+d-1])break;if(e<=b[k-1])return Zr(b,h,k,d,e,!1);h=k}}return null};function U(b,c){bf.call(this);this.g=null;this.C=this.D=this.l=-1;this.ma(b,c)}z(U,bf);l=U.prototype;l.sj=function(b){this.A?jb(this.A,b):this.A=b.slice();this.u()};l.clone=function(){var b=new U(null);b.ba(this.b,this.A.slice());return b};l.pb=function(b,c,d,e){if(e<Rd(this.J(),b,c))return e;this.C!=this.f&&(this.D=Math.sqrt(jf(this.A,0,this.A.length,this.a,0)),this.C=this.f);return lf(this.A,0,this.A.length,this.a,this.D,!1,b,c,d,e)};
l.Ij=function(b,c){return Bf(this.A,0,this.A.length,this.a,b,c)};l.hm=function(b,c){return"XYM"!=this.b&&"XYZM"!=this.b?null:Zr(this.A,0,this.A.length,this.a,b,void 0!==c?c:!1)};l.Z=function(){return qf(this.A,0,this.A.length,this.a)};l.Ag=function(b,c){return Yr(this.A,0,this.A.length,this.a,b,c)};l.im=function(){var b=this.A,c=this.a,d=b[0],e=b[1],f=0,g;for(g=0+c;g<this.A.length;g+=c)var h=b[g],k=b[g+1],f=f+Math.sqrt((h-d)*(h-d)+(k-e)*(k-e)),d=h,e=k;return f};
function tm(b){b.l!=b.f&&(b.g=b.Ag(.5,b.g),b.l=b.f);return b.g}l.Nc=function(b){var c=[];c.length=sf(this.A,0,this.A.length,this.a,b,c,0);b=new U(null);b.ba("XY",c);return b};l.V=function(){return"LineString"};l.Fa=function(b){return Cf(this.A,0,this.A.length,this.a,b)};l.ma=function(b,c){b?(ef(this,c,b,1),this.A||(this.A=[]),this.A.length=of(this.A,0,b,this.a),this.u()):this.ba("XY",null)};l.ba=function(b,c){df(this,b,c);this.u()};function V(b,c){bf.call(this);this.g=[];this.l=this.C=-1;this.ma(b,c)}z(V,bf);l=V.prototype;l.tj=function(b){this.A?jb(this.A,b.ja().slice()):this.A=b.ja().slice();this.g.push(this.A.length);this.u()};l.clone=function(){var b=new V(null);b.ba(this.b,this.A.slice(),this.g.slice());return b};l.pb=function(b,c,d,e){if(e<Rd(this.J(),b,c))return e;this.l!=this.f&&(this.C=Math.sqrt(kf(this.A,0,this.g,this.a,0)),this.l=this.f);return mf(this.A,0,this.g,this.a,this.C,!1,b,c,d,e)};
l.km=function(b,c,d){return"XYM"!=this.b&&"XYZM"!=this.b||0===this.A.length?null:$r(this.A,this.g,this.a,b,void 0!==c?c:!1,void 0!==d?d:!1)};l.Z=function(){return rf(this.A,0,this.g,this.a)};l.Bb=function(){return this.g};l.bk=function(b){if(0>b||this.g.length<=b)return null;var c=new U(null);c.ba(this.b,this.A.slice(0===b?0:this.g[b-1],this.g[b]));return c};
l.ud=function(){var b=this.A,c=this.g,d=this.b,e=[],f=0,g,h;g=0;for(h=c.length;g<h;++g){var k=c[g],m=new U(null);m.ba(d,b.slice(f,k));e.push(m);f=k}return e};function um(b){var c=[],d=b.A,e=0,f=b.g;b=b.a;var g,h;g=0;for(h=f.length;g<h;++g){var k=f[g],e=Yr(d,e,k,b,.5);jb(c,e);e=k}return c}l.Nc=function(b){var c=[],d=[],e=this.A,f=this.g,g=this.a,h=0,k=0,m,n;m=0;for(n=f.length;m<n;++m){var p=f[m],k=sf(e,h,p,g,b,c,k);d.push(k);h=p}c.length=k;b=new V(null);b.ba("XY",c,d);return b};l.V=function(){return"MultiLineString"};
l.Fa=function(b){a:{var c=this.A,d=this.g,e=this.a,f=0,g,h;g=0;for(h=d.length;g<h;++g){if(Cf(c,f,d[g],e,b)){b=!0;break a}f=d[g]}b=!1}return b};l.ma=function(b,c){if(b){ef(this,c,b,2);this.A||(this.A=[]);var d=pf(this.A,0,b,this.a,this.g);this.A.length=0===d.length?0:d[d.length-1];this.u()}else this.ba("XY",null,this.g)};l.ba=function(b,c,d){df(this,b,c);this.g=d;this.u()};
function as(b,c){var d=b.b,e=[],f=[],g,h;g=0;for(h=c.length;g<h;++g){var k=c[g];0===g&&(d=k.b);jb(e,k.ja());f.push(e.length)}b.ba(d,e,f)};function bs(b,c){bf.call(this);this.ma(b,c)}z(bs,bf);l=bs.prototype;l.vj=function(b){this.A?jb(this.A,b.ja()):this.A=b.ja().slice();this.u()};l.clone=function(){var b=new bs(null);b.ba(this.b,this.A.slice());return b};l.pb=function(b,c,d,e){if(e<Rd(this.J(),b,c))return e;var f=this.A,g=this.a,h,k,m;h=0;for(k=f.length;h<k;h+=g)if(m=Va(b,c,f[h],f[h+1]),m<e){e=m;for(m=0;m<g;++m)d[m]=f[h+m];d.length=g}return e};l.Z=function(){return qf(this.A,0,this.A.length,this.a)};
l.mk=function(b){var c=this.A?this.A.length/this.a:0;if(0>b||c<=b)return null;c=new F(null);c.ba(this.b,this.A.slice(b*this.a,(b+1)*this.a));return c};l.xe=function(){var b=this.A,c=this.b,d=this.a,e=[],f,g;f=0;for(g=b.length;f<g;f+=d){var h=new F(null);h.ba(c,b.slice(f,f+d));e.push(h)}return e};l.V=function(){return"MultiPoint"};l.Fa=function(b){var c=this.A,d=this.a,e,f,g,h;e=0;for(f=c.length;e<f;e+=d)if(g=c[e],h=c[e+1],Td(b,g,h))return!0;return!1};
l.ma=function(b,c){b?(ef(this,c,b,1),this.A||(this.A=[]),this.A.length=of(this.A,0,b,this.a),this.u()):this.ba("XY",null)};l.ba=function(b,c){df(this,b,c);this.u()};function cs(b,c){bf.call(this);this.g=[];this.C=-1;this.D=null;this.T=this.O=this.U=-1;this.l=null;this.ma(b,c)}z(cs,bf);l=cs.prototype;l.wj=function(b){if(this.A){var c=this.A.length;jb(this.A,b.ja());b=b.Bb().slice();var d,e;d=0;for(e=b.length;d<e;++d)b[d]+=c}else this.A=b.ja().slice(),b=b.Bb().slice(),this.g.push();this.g.push(b);this.u()};l.clone=function(){var b=new cs(null),c=Sb(this.g);ds(b,this.b,this.A.slice(),c);return b};
l.pb=function(b,c,d,e){if(e<Rd(this.J(),b,c))return e;if(this.O!=this.f){var f=this.g,g=0,h=0,k,m;k=0;for(m=f.length;k<m;++k)var n=f[k],h=kf(this.A,g,n,this.a,h),g=n[n.length-1];this.U=Math.sqrt(h);this.O=this.f}f=vm(this);g=this.g;h=this.a;k=this.U;m=0;var n=[NaN,NaN],p,q;p=0;for(q=g.length;p<q;++p){var r=g[p];e=mf(f,m,r,h,k,!0,b,c,d,e,n);m=r[r.length-1]}return e};
l.yc=function(b,c){var d;a:{d=vm(this);var e=this.g,f=0;if(0!==e.length){var g,h;g=0;for(h=e.length;g<h;++g){var k=e[g];if(zf(d,f,k,this.a,b,c)){d=!0;break a}f=k[k.length-1]}}d=!1}return d};l.lm=function(){var b=vm(this),c=this.g,d=0,e=0,f,g;f=0;for(g=c.length;f<g;++f)var h=c[f],e=e+gf(b,d,h,this.a),d=h[h.length-1];return e};
l.Z=function(b){var c;void 0!==b?(c=vm(this).slice(),Hf(c,this.g,this.a,b)):c=this.A;b=c;c=this.g;var d=this.a,e=0,f=[],g=0,h,k;h=0;for(k=c.length;h<k;++h){var m=c[h];f[g++]=rf(b,e,m,d,f[g]);e=m[m.length-1]}f.length=g;return f};
function xm(b){if(b.C!=b.f){var c=b.A,d=b.g,e=b.a,f=0,g=[],h,k,m=Ld();h=0;for(k=d.length;h<k;++h){var n=d[h],m=Xd(c,f,n[0],e);g.push((m[0]+m[2])/2,(m[1]+m[3])/2);f=n[n.length-1]}c=vm(b);d=b.g;e=b.a;f=0;h=[];k=0;for(m=d.length;k<m;++k)n=d[k],h=Af(c,f,n,e,g,2*k,h),f=n[n.length-1];b.D=h;b.C=b.f}return b.D}l.Zj=function(){var b=new bs(null);b.ba("XY",xm(this).slice());return b};
function vm(b){if(b.T!=b.f){var c=b.A,d;a:{d=b.g;var e,f;e=0;for(f=d.length;e<f;++e)if(!Ff(c,d[e],b.a,void 0)){d=!1;break a}d=!0}d?b.l=c:(b.l=c.slice(),b.l.length=Hf(b.l,b.g,b.a));b.T=b.f}return b.l}l.Nc=function(b){var c=[],d=[],e=this.A,f=this.g,g=this.a;b=Math.sqrt(b);var h=0,k=0,m,n;m=0;for(n=f.length;m<n;++m){var p=f[m],q=[],k=tf(e,h,p,g,b,c,k,q);d.push(q);h=p[p.length-1]}c.length=k;e=new cs(null);ds(e,"XY",c,d);return e};
l.pk=function(b){if(0>b||this.g.length<=b)return null;var c;0===b?c=0:(c=this.g[b-1],c=c[c.length-1]);b=this.g[b].slice();var d=b[b.length-1];if(0!==c){var e,f;e=0;for(f=b.length;e<f;++e)b[e]-=c}e=new G(null);e.ba(this.b,this.A.slice(c,d),b);return e};l.ee=function(){var b=this.b,c=this.A,d=this.g,e=[],f=0,g,h,k,m;g=0;for(h=d.length;g<h;++g){var n=d[g].slice(),p=n[n.length-1];if(0!==f)for(k=0,m=n.length;k<m;++k)n[k]-=f;k=new G(null);k.ba(b,c.slice(f,p),n);e.push(k);f=p}return e};l.V=function(){return"MultiPolygon"};
l.Fa=function(b){a:{var c=vm(this),d=this.g,e=this.a,f=0,g,h;g=0;for(h=d.length;g<h;++g){var k=d[g];if(Df(c,f,k,e,b)){b=!0;break a}f=k[k.length-1]}b=!1}return b};l.ma=function(b,c){if(b){ef(this,c,b,3);this.A||(this.A=[]);var d=this.A,e=this.a,f=this.g,g=0,f=f?f:[],h=0,k,m;k=0;for(m=b.length;k<m;++k)g=pf(d,g,b[k],e,f[h]),f[h++]=g,g=g[g.length-1];f.length=h;0===f.length?this.A.length=0:(d=f[f.length-1],this.A.length=0===d.length?0:d[d.length-1]);this.u()}else ds(this,"XY",null,this.g)};
function ds(b,c,d,e){df(b,c,d);b.g=e;b.u()}function es(b,c){var d=b.b,e=[],f=[],g,h,k;g=0;for(h=c.length;g<h;++g){var m=c[g];0===g&&(d=m.b);var n=e.length;k=m.Bb();var p,q;p=0;for(q=k.length;p<q;++p)k[p]+=n;jb(e,m.ja());f.push(k)}ds(b,d,e,f)};function fs(b){b=b?b:{};this.defaultDataProjection=null;this.a=b.geometryName}z(fs,Wr);
function gs(b,c){if(!b)return null;var d;if(ma(b.x)&&ma(b.y))d="Point";else if(b.points)d="MultiPoint";else if(b.paths)d=1===b.paths.length?"LineString":"MultiLineString";else if(b.rings){var e=b.rings,f=hs(b),g=[];d=[];var h,k;h=0;for(k=e.length;h<k;++h){var m=sb(e[h]);Ef(m,0,m.length,f.length)?g.push([e[h]]):d.push(e[h])}for(;d.length;){e=d.shift();f=!1;for(h=g.length-1;0<=h;h--)if(Ud((new vf(g[h][0])).J(),(new vf(e)).J())){g[h].push(e);f=!0;break}f||g.push([e.reverse()])}b=Rb(b);1===g.length?(d=
"Polygon",b.rings=g[0]):(d="MultiPolygon",b.rings=g)}return Vr((0,is[d])(b),!1,c)}function hs(b){var c="XY";!0===b.hasZ&&!0===b.hasM?c="XYZM":!0===b.hasZ?c="XYZ":!0===b.hasM&&(c="XYM");return c}function js(b){b=b.b;return{hasZ:"XYZ"===b||"XYZM"===b,hasM:"XYM"===b||"XYZM"===b}}
var is={Point:function(b){return void 0!==b.m&&void 0!==b.z?new F([b.x,b.y,b.z,b.m],"XYZM"):void 0!==b.z?new F([b.x,b.y,b.z],"XYZ"):void 0!==b.m?new F([b.x,b.y,b.m],"XYM"):new F([b.x,b.y])},LineString:function(b){return new U(b.paths[0],hs(b))},Polygon:function(b){return new G(b.rings,hs(b))},MultiPoint:function(b){return new bs(b.points,hs(b))},MultiLineString:function(b){return new V(b.paths,hs(b))},MultiPolygon:function(b){return new cs(b.rings,hs(b))}},ks={Point:function(b){var c=b.Z();b=b.b;
if("XYZ"===b)return{x:c[0],y:c[1],z:c[2]};if("XYM"===b)return{x:c[0],y:c[1],m:c[2]};if("XYZM"===b)return{x:c[0],y:c[1],z:c[2],m:c[3]};if("XY"===b)return{x:c[0],y:c[1]}},LineString:function(b){var c=js(b);return{hasZ:c.hasZ,hasM:c.hasM,paths:[b.Z()]}},Polygon:function(b){var c=js(b);return{hasZ:c.hasZ,hasM:c.hasM,rings:b.Z(!1)}},MultiPoint:function(b){var c=js(b);return{hasZ:c.hasZ,hasM:c.hasM,points:b.Z()}},MultiLineString:function(b){var c=js(b);return{hasZ:c.hasZ,hasM:c.hasM,paths:b.Z()}},MultiPolygon:function(b){var c=
js(b);b=b.Z(!1);for(var d=[],e=0;e<b.length;e++)for(var f=b[e].length-1;0<=f;f--)d.push(b[e][f]);return{hasZ:c.hasZ,hasM:c.hasM,rings:d}}};l=fs.prototype;l.Tc=function(b,c){var d=gs(b.geometry,c),e=new un;this.a&&e.Cc(this.a);e.Oa(d);c&&c.vf&&b.attributes[c.vf]&&e.kc(b.attributes[c.vf]);b.attributes&&e.I(b.attributes);return e};
l.Of=function(b,c){var d=c?c:{};if(b.features){var e=[],f=b.features,g,h;d.vf=b.objectIdFieldName;g=0;for(h=f.length;g<h;++g)e.push(this.Tc(f[g],d));return e}return[this.Tc(b,d)]};l.Mh=function(b,c){return gs(b,c)};l.Th=function(b){return b.spatialReference&&b.spatialReference.wkid?Ee("EPSG:"+b.spatialReference.wkid):null};function ls(b,c){return(0,ks[b.V()])(Vr(b,!0,c),c)}l.We=function(b,c){return ls(b,Ur(this,c))};
l.Yc=function(b,c){c=Ur(this,c);var d={},e=b.W();e&&(d.geometry=ls(e,c));e=b.R();delete e[b.a];d.attributes=Nb(e)?{}:e;c&&c.featureProjection&&(d.spatialReference={wkid:Ee(c.featureProjection).Ya.split(":").pop()});return d};l.Ue=function(b,c){c=Ur(this,c);var d=[],e,f;e=0;for(f=b.length;e<f;++e)d.push(this.Yc(b[e],c));return{features:d}};function ms(b){$e.call(this);this.c=b?b:null;ns(this)}z(ms,$e);function os(b){var c=[],d,e;d=0;for(e=b.length;d<e;++d)c.push(b[d].clone());return c}function ps(b){var c,d;if(b.c)for(c=0,d=b.c.length;c<d;++c)Vc(b.c[c],"change",b.u,!1,b)}function ns(b){var c,d;if(b.c)for(c=0,d=b.c.length;c<d;++c)D(b.c[c],"change",b.u,!1,b)}l=ms.prototype;l.clone=function(){var b=new ms(null);b.ei(this.c);return b};
l.pb=function(b,c,d,e){if(e<Rd(this.J(),b,c))return e;var f=this.c,g,h;g=0;for(h=f.length;g<h;++g)e=f[g].pb(b,c,d,e);return e};l.yc=function(b,c){var d=this.c,e,f;e=0;for(f=d.length;e<f;++e)if(d[e].yc(b,c))return!0;return!1};l.Xd=function(b){Od(Infinity,Infinity,-Infinity,-Infinity,b);for(var c=this.c,d=0,e=c.length;d<e;++d)ae(b,c[d].J());return b};l.Fg=function(){return os(this.c)};
l.vd=function(b){this.o!=this.f&&(Ob(this.i),this.j=0,this.o=this.f);if(0>b||0!==this.j&&b<this.j)return this;var c=b.toString();if(this.i.hasOwnProperty(c))return this.i[c];var d=[],e=this.c,f=!1,g,h;g=0;for(h=e.length;g<h;++g){var k=e[g],m=k.vd(b);d.push(m);m!==k&&(f=!0)}if(f)return b=new ms(null),ps(b),b.c=d,ns(b),b.u(),this.i[c]=b;this.j=b;return this};l.V=function(){return"GeometryCollection"};l.Fa=function(b){var c=this.c,d,e;d=0;for(e=c.length;d<e;++d)if(c[d].Fa(b))return!0;return!1};
l.Na=function(){return 0===this.c.length};l.ei=function(b){b=os(b);ps(this);this.c=b;ns(this);this.u()};l.qc=function(b){var c=this.c,d,e;d=0;for(e=c.length;d<e;++d)c[d].qc(b);this.u()};l.Qc=function(b,c){var d=this.c,e,f;e=0;for(f=d.length;e<f;++e)d[e].Qc(b,c);this.u()};l.X=function(){ps(this);ms.da.X.call(this)};function qs(b){b=b?b:{};this.defaultDataProjection=null;this.defaultDataProjection=Ee(b.defaultDataProjection?b.defaultDataProjection:"EPSG:4326");this.a=b.geometryName}z(qs,Wr);function rs(b,c){return b?Vr((0,ss[b.type])(b),!1,c):null}function ts(b,c){return(0,us[b.V()])(Vr(b,!0,c),c)}
var ss={Point:function(b){return new F(b.coordinates)},LineString:function(b){return new U(b.coordinates)},Polygon:function(b){return new G(b.coordinates)},MultiPoint:function(b){return new bs(b.coordinates)},MultiLineString:function(b){return new V(b.coordinates)},MultiPolygon:function(b){return new cs(b.coordinates)},GeometryCollection:function(b,c){var d=b.geometries.map(function(b){return rs(b,c)});return new ms(d)}},us={Point:function(b){return{type:"Point",coordinates:b.Z()}},LineString:function(b){return{type:"LineString",
coordinates:b.Z()}},Polygon:function(b,c){var d;c&&(d=c.rightHanded);return{type:"Polygon",coordinates:b.Z(d)}},MultiPoint:function(b){return{type:"MultiPoint",coordinates:b.Z()}},MultiLineString:function(b){return{type:"MultiLineString",coordinates:b.Z()}},MultiPolygon:function(b,c){var d;c&&(d=c.rightHanded);return{type:"MultiPolygon",coordinates:b.Z(d)}},GeometryCollection:function(b,c){return{type:"GeometryCollection",geometries:b.c.map(function(b){return ts(b,c)})}},Circle:function(){return{type:"GeometryCollection",
geometries:[]}}};l=qs.prototype;l.Tc=function(b,c){var d=rs(b.geometry,c),e=new un;this.a&&e.Cc(this.a);e.Oa(d);void 0!==b.id&&e.kc(b.id);b.properties&&e.I(b.properties);return e};l.Of=function(b,c){if("Feature"==b.type)return[this.Tc(b,c)];if("FeatureCollection"==b.type){var d=[],e=b.features,f,g;f=0;for(g=e.length;f<g;++f)d.push(this.Tc(e[f],c));return d}return[]};l.Mh=function(b,c){return rs(b,c)};
l.Th=function(b){return(b=b.crs)?"name"==b.type?Ee(b.properties.name):"EPSG"==b.type?Ee("EPSG:"+b.properties.code):null:this.defaultDataProjection};l.Yc=function(b,c){c=Ur(this,c);var d={type:"Feature"},e=b.Qa();void 0!==e&&(d.id=e);(e=b.W())?d.geometry=ts(e,c):d.geometry=null;e=b.R();delete e[b.a];Nb(e)?d.properties=null:d.properties=e;return d};l.Ue=function(b,c){c=Ur(this,c);var d=[],e,f;e=0;for(f=b.length;e<f;++e)d.push(this.Yc(b[e],c));return{type:"FeatureCollection",features:d}};
l.We=function(b,c){return ts(b,Ur(this,c))};function vs(){this.defaultDataProjection=null}z(vs,Sr);l=vs.prototype;l.V=function(){return"xml"};l.Ub=function(b,c){if(Xo(b))return ws(this,b,c);if($o(b))return this.Kh(b,c);if(la(b)){var d=jp(b);return ws(this,d,c)}return null};function ws(b,c,d){b=xs(b,c,d);return 0<b.length?b[0]:null}l.Ca=function(b,c){if(Xo(b))return xs(this,b,c);if($o(b))return this.jc(b,c);if(la(b)){var d=jp(b);return xs(this,d,c)}return[]};
function xs(b,c,d){var e=[];for(c=c.firstChild;c;c=c.nextSibling)1==c.nodeType&&jb(e,b.jc(c,d));return e}l.Uc=function(b,c){if(Xo(b))return this.G(b,c);if($o(b)){var d=this.Le(b,[Tr(this,b,c?c:{})]);return d?d:null}return la(b)?(d=jp(b),this.G(d,c)):null};l.Ka=function(b){return Xo(b)?this.Uf(b):$o(b)?this.Oe(b):la(b)?(b=jp(b),this.Uf(b)):null};l.Uf=function(){return this.defaultDataProjection};l.Oe=function(){return this.defaultDataProjection};l.Ld=function(b,c){var d=this.v(b,c);return Jo(d)};
l.Wb=function(b,c){var d=this.f(b,c);return Jo(d)};l.Zc=function(b,c){var d=this.o(b,c);return Jo(d)};function ys(b){b=b?b:{};this.featureType=b.featureType;this.featureNS=b.featureNS;this.srsName=b.srsName;this.schemaLocation="";this.a={};this.a["http://www.opengis.net/gml"]={featureMember:mp(ys.prototype.Gd),featureMembers:mp(ys.prototype.Gd)};this.defaultDataProjection=null}z(ys,vs);l=ys.prototype;
l.Gd=function(b,c){var d=Uo(b),e;if("FeatureCollection"==d)"http://www.opengis.net/wfs"===b.namespaceURI?e=S([],this.a,b,c,this):e=S(null,this.a,b,c,this);else if("featureMembers"==d||"featureMember"==d){var f=c[0],g=f.featureType;e=f.featureNS;var h,k;if(!g&&b.childNodes){g=[];e={};h=0;for(k=b.childNodes.length;h<k;++h){var m=b.childNodes[h];if(1===m.nodeType){var n=m.nodeName.split(":").pop();if(-1===g.indexOf(n)){var p;Lb(e,m.namespaceURI)?p=Mb(e,function(b){return b===m.namespaceURI}):(p="p"+
Jb(e),e[p]=m.namespaceURI);g.push(p+":"+n)}}}f.featureType=g;f.featureNS=e}la(e)&&(h=e,e={},e.p0=h);var f={},g=ia(g)?g:[g],q;for(q in e){n={};h=0;for(k=g.length;h<k;++h)(-1===g[h].indexOf(":")?"p0":g[h].split(":")[0])===q&&(n[g[h].split(":").pop()]="featureMembers"==d?lp(this.Nf,this):mp(this.Nf,this));f[e[q]]=n}e=S([],f,b,c)}e||(e=[]);return e};l.Le=function(b,c){var d=c[0];d.srsName=b.firstElementChild.getAttribute("srsName");var e=S(null,this.fg,b,c,this);if(e)return Vr(e,!1,d)};
l.Nf=function(b,c){var d,e=b.getAttribute("fid")||dp(b,"http://www.opengis.net/gml","id"),f={},g;for(d=b.firstElementChild;d;d=d.nextElementSibling){var h=Uo(d);if(0===d.childNodes.length||1===d.childNodes.length&&(3===d.firstChild.nodeType||4===d.firstChild.nodeType)){var k=Qo(d,!1);/^[\s\xa0]*$/.test(k)&&(k=void 0);f[h]=k}else"boundedBy"!==h&&(g=h),f[h]=this.Le(d,c)}d=new un(f);g&&d.Cc(g);e&&d.kc(e);return d};l.Sh=function(b,c){var d=this.Ke(b,c);if(d){var e=new F(null);e.ba("XYZ",d);return e}};
l.Qh=function(b,c){var d=S([],this.Ri,b,c,this);if(d)return new bs(d)};l.Ph=function(b,c){var d=S([],this.Qi,b,c,this);if(d){var e=new V(null);as(e,d);return e}};l.Rh=function(b,c){var d=S([],this.Si,b,c,this);if(d){var e=new cs(null);es(e,d);return e}};l.Hh=function(b,c){tp(this.Vi,b,c,this)};l.Vg=function(b,c){tp(this.Oi,b,c,this)};l.Ih=function(b,c){tp(this.Wi,b,c,this)};l.Me=function(b,c){var d=this.Ke(b,c);if(d){var e=new U(null);e.ba("XYZ",d);return e}};
l.ro=function(b,c){var d=S(null,this.Nd,b,c,this);if(d)return d};l.Oh=function(b,c){var d=this.Ke(b,c);if(d){var e=new vf(null);wf(e,"XYZ",d);return e}};l.Ne=function(b,c){var d=S([null],this.Ye,b,c,this);if(d&&d[0]){var e=new G(null),f=d[0],g=[f.length],h,k;h=1;for(k=d.length;h<k;++h)jb(f,d[h]),g.push(f.length);e.ba("XYZ",f,g);return e}};l.Ke=function(b,c){return S(null,this.Nd,b,c,this)};l.Ri=Object({"http://www.opengis.net/gml":{pointMember:lp(ys.prototype.Hh),pointMembers:lp(ys.prototype.Hh)}});
l.Qi=Object({"http://www.opengis.net/gml":{lineStringMember:lp(ys.prototype.Vg),lineStringMembers:lp(ys.prototype.Vg)}});l.Si=Object({"http://www.opengis.net/gml":{polygonMember:lp(ys.prototype.Ih),polygonMembers:lp(ys.prototype.Ih)}});l.Vi=Object({"http://www.opengis.net/gml":{Point:lp(ys.prototype.Ke)}});l.Oi=Object({"http://www.opengis.net/gml":{LineString:lp(ys.prototype.Me)}});l.Wi=Object({"http://www.opengis.net/gml":{Polygon:lp(ys.prototype.Ne)}});l.Od=Object({"http://www.opengis.net/gml":{LinearRing:mp(ys.prototype.ro)}});
l.jc=function(b,c){var d={featureType:this.featureType,featureNS:this.featureNS};c&&Ub(d,Tr(this,b,c));return this.Gd(b,[d])};l.Oe=function(b){return Ee(this.B?this.B:b.firstElementChild.getAttribute("srsName"))};function zs(b){b=Qo(b,!1);return As(b)}function As(b){if(b=/^\s*(true|1)|(false|0)\s*$/.exec(b))return void 0!==b[1]||!1}
function Bs(b){b=Qo(b,!1);if(b=/^\s*(\d{4})-(\d{2})-(\d{2})T(\d{2}):(\d{2}):(\d{2})(Z|(?:([+\-])(\d{2})(?::(\d{2}))?))\s*$/.exec(b)){var c=Date.UTC(parseInt(b[1],10),parseInt(b[2],10)-1,parseInt(b[3],10),parseInt(b[4],10),parseInt(b[5],10),parseInt(b[6],10))/1E3;if("Z"!=b[7]){var d="-"==b[8]?-1:1,c=c+60*d*parseInt(b[9],10);void 0!==b[10]&&(c+=3600*d*parseInt(b[10],10))}return c}}function Cs(b){b=Qo(b,!1);return Ds(b)}
function Ds(b){if(b=/^\s*([+\-]?\d*\.?\d+(?:e[+\-]?\d+)?)\s*$/i.exec(b))return parseFloat(b[1])}function Es(b){b=Qo(b,!1);return Fs(b)}function Fs(b){if(b=/^\s*(\d+)\s*$/.exec(b))return parseInt(b[1],10)}function W(b){return Qo(b,!1).trim()}function Gs(b,c){Hs(b,c?"1":"0")}function Is(b,c){b.appendChild(Mo.createTextNode(c.toPrecision()))}function Js(b,c){b.appendChild(Mo.createTextNode(c.toString()))}function Hs(b,c){b.appendChild(Mo.createTextNode(c))};function Ks(b){b=b?b:{};ys.call(this,b);this.a["http://www.opengis.net/gml"].featureMember=lp(ys.prototype.Gd);this.schemaLocation=b.schemaLocation?b.schemaLocation:"http://www.opengis.net/gml http://schemas.opengis.net/gml/2.1.2/feature.xsd"}z(Ks,ys);l=Ks.prototype;
l.Lh=function(b,c){var d=Qo(b,!1).replace(/^\s*|\s*$/g,""),e=c[0].srsName,f=b.parentNode.getAttribute("srsDimension"),g="enu";e&&(e=Ee(e))&&(g=e.c);d=d.split(/[\s,]+/);e=2;b.getAttribute("srsDimension")?e=Fs(b.getAttribute("srsDimension")):b.getAttribute("dimension")?e=Fs(b.getAttribute("dimension")):f&&(e=Fs(f));for(var h,k,m=[],n=0,p=d.length;n<p;n+=e)f=parseFloat(d[n]),h=parseFloat(d[n+1]),k=3===e?parseFloat(d[n+2]):0,"en"===g.substr(0,2)?m.push(f,h,k):m.push(h,f,k);return m};
l.oo=function(b,c){var d=S([null],this.Ki,b,c,this);return Od(d[1][0],d[1][1],d[1][3],d[1][4])};l.ll=function(b,c){var d=S(void 0,this.Od,b,c,this);d&&c[c.length-1].push(d)};l.Xn=function(b,c){var d=S(void 0,this.Od,b,c,this);d&&(c[c.length-1][0]=d)};l.Nd=Object({"http://www.opengis.net/gml":{coordinates:mp(Ks.prototype.Lh)}});l.Ye=Object({"http://www.opengis.net/gml":{innerBoundaryIs:Ks.prototype.ll,outerBoundaryIs:Ks.prototype.Xn}});l.Ki=Object({"http://www.opengis.net/gml":{coordinates:lp(Ks.prototype.Lh)}});
l.fg=Object({"http://www.opengis.net/gml":{Point:mp(ys.prototype.Sh),MultiPoint:mp(ys.prototype.Qh),LineString:mp(ys.prototype.Me),MultiLineString:mp(ys.prototype.Ph),LinearRing:mp(ys.prototype.Oh),Polygon:mp(ys.prototype.Ne),MultiPolygon:mp(ys.prototype.Rh),Box:mp(Ks.prototype.oo)}});function Ls(b){b=b?b:{};ys.call(this,b);this.l=void 0!==b.surface?b.surface:!1;this.g=void 0!==b.curve?b.curve:!1;this.i=void 0!==b.multiCurve?b.multiCurve:!0;this.j=void 0!==b.multiSurface?b.multiSurface:!0;this.schemaLocation=b.schemaLocation?b.schemaLocation:"http://www.opengis.net/gml http://schemas.opengis.net/gml/3.1.1/profiles/gmlsfProfile/1.0.0/gmlsf.xsd"}z(Ls,ys);l=Ls.prototype;l.vo=function(b,c){var d=S([],this.Pi,b,c,this);if(d){var e=new V(null);as(e,d);return e}};
l.wo=function(b,c){var d=S([],this.Ti,b,c,this);if(d){var e=new cs(null);es(e,d);return e}};l.vg=function(b,c){tp(this.Li,b,c,this)};l.si=function(b,c){tp(this.$i,b,c,this)};l.zo=function(b,c){return S([null],this.Ui,b,c,this)};l.Bo=function(b,c){return S([null],this.Zi,b,c,this)};l.Ao=function(b,c){return S([null],this.Ye,b,c,this)};l.uo=function(b,c){return S([null],this.Nd,b,c,this)};l.nl=function(b,c){var d=S(void 0,this.Od,b,c,this);d&&c[c.length-1].push(d)};
l.Ej=function(b,c){var d=S(void 0,this.Od,b,c,this);d&&(c[c.length-1][0]=d)};l.Uh=function(b,c){var d=S([null],this.aj,b,c,this);if(d&&d[0]){var e=new G(null),f=d[0],g=[f.length],h,k;h=1;for(k=d.length;h<k;++h)jb(f,d[h]),g.push(f.length);e.ba("XYZ",f,g);return e}};l.Jh=function(b,c){var d=S([null],this.Mi,b,c,this);if(d){var e=new U(null);e.ba("XYZ",d);return e}};l.qo=function(b,c){var d=S([null],this.Ni,b,c,this);return Od(d[1][0],d[1][1],d[2][0],d[2][1])};
l.so=function(b,c){for(var d=Qo(b,!1),e=/^\s*([+\-]?\d*\.?\d+(?:[eE][+\-]?\d+)?)\s*/,f=[],g;g=e.exec(d);)f.push(parseFloat(g[1])),d=d.substr(g[0].length);if(""===d){d=c[0].srsName;e="enu";d&&(e=He(Ee(d)));if("neu"===e)for(d=0,e=f.length;d<e;d+=3)g=f[d],f[d]=f[d+1],f[d+1]=g;d=f.length;2==d&&f.push(0);return 0===d?void 0:f}};
l.Rf=function(b,c){var d=Qo(b,!1).replace(/^\s*|\s*$/g,""),e=c[0].srsName,f=b.parentNode.getAttribute("srsDimension"),g="enu";e&&(g=He(Ee(e)));d=d.split(/\s+/);e=2;b.getAttribute("srsDimension")?e=Fs(b.getAttribute("srsDimension")):b.getAttribute("dimension")?e=Fs(b.getAttribute("dimension")):f&&(e=Fs(f));for(var h,k,m=[],n=0,p=d.length;n<p;n+=e)f=parseFloat(d[n]),h=parseFloat(d[n+1]),k=3===e?parseFloat(d[n+2]):0,"en"===g.substr(0,2)?m.push(f,h,k):m.push(h,f,k);return m};
l.Nd=Object({"http://www.opengis.net/gml":{pos:mp(Ls.prototype.so),posList:mp(Ls.prototype.Rf)}});l.Ye=Object({"http://www.opengis.net/gml":{interior:Ls.prototype.nl,exterior:Ls.prototype.Ej}});
l.fg=Object({"http://www.opengis.net/gml":{Point:mp(ys.prototype.Sh),MultiPoint:mp(ys.prototype.Qh),LineString:mp(ys.prototype.Me),MultiLineString:mp(ys.prototype.Ph),LinearRing:mp(ys.prototype.Oh),Polygon:mp(ys.prototype.Ne),MultiPolygon:mp(ys.prototype.Rh),Surface:mp(Ls.prototype.Uh),MultiSurface:mp(Ls.prototype.wo),Curve:mp(Ls.prototype.Jh),MultiCurve:mp(Ls.prototype.vo),Envelope:mp(Ls.prototype.qo)}});l.Pi=Object({"http://www.opengis.net/gml":{curveMember:lp(Ls.prototype.vg),curveMembers:lp(Ls.prototype.vg)}});
l.Ti=Object({"http://www.opengis.net/gml":{surfaceMember:lp(Ls.prototype.si),surfaceMembers:lp(Ls.prototype.si)}});l.Li=Object({"http://www.opengis.net/gml":{LineString:lp(ys.prototype.Me),Curve:lp(Ls.prototype.Jh)}});l.$i=Object({"http://www.opengis.net/gml":{Polygon:lp(ys.prototype.Ne),Surface:lp(Ls.prototype.Uh)}});l.aj=Object({"http://www.opengis.net/gml":{patches:mp(Ls.prototype.zo)}});l.Mi=Object({"http://www.opengis.net/gml":{segments:mp(Ls.prototype.Bo)}});
l.Ni=Object({"http://www.opengis.net/gml":{lowerCorner:lp(Ls.prototype.Rf),upperCorner:lp(Ls.prototype.Rf)}});l.Ui=Object({"http://www.opengis.net/gml":{PolygonPatch:mp(Ls.prototype.Ao)}});l.Zi=Object({"http://www.opengis.net/gml":{LineStringSegment:mp(Ls.prototype.uo)}});function Ms(b,c,d){d=d[d.length-1].srsName;c=c.Z();for(var e=c.length,f=Array(e),g,h=0;h<e;++h){g=c[h];var k=h,m="enu";d&&(m=He(Ee(d)));f[k]="en"===m.substr(0,2)?g[0]+" "+g[1]:g[1]+" "+g[0]}Hs(b,f.join(" "))}
l.Gi=function(b,c,d){var e=d[d.length-1].srsName;e&&b.setAttribute("srsName",e);e=Po(b.namespaceURI,"pos");b.appendChild(e);d=d[d.length-1].srsName;b="enu";d&&(b=He(Ee(d)));c=c.Z();Hs(e,"en"===b.substr(0,2)?c[0]+" "+c[1]:c[1]+" "+c[0])};var Ns={"http://www.opengis.net/gml":{lowerCorner:O(Hs),upperCorner:O(Hs)}};l=Ls.prototype;l.np=function(b,c,d){var e=d[d.length-1].srsName;e&&b.setAttribute("srsName",e);up({node:b},Ns,rp,[c[0]+" "+c[1],c[2]+" "+c[3]],d,["lowerCorner","upperCorner"],this)};
l.Di=function(b,c,d){var e=d[d.length-1].srsName;e&&b.setAttribute("srsName",e);e=Po(b.namespaceURI,"posList");b.appendChild(e);Ms(e,c,d)};l.Yi=function(b,c){var d=c[c.length-1],e=d.node,f=d.exteriorWritten;void 0===f&&(d.exteriorWritten=!0);return Po(e.namespaceURI,void 0!==f?"interior":"exterior")};
l.Xe=function(b,c,d){var e=d[d.length-1].srsName;"PolygonPatch"!==b.nodeName&&e&&b.setAttribute("srsName",e);"Polygon"===b.nodeName||"PolygonPatch"===b.nodeName?(c=c.de(),up({node:b,srsName:e},Os,this.Yi,c,d,void 0,this)):"Surface"===b.nodeName&&(e=Po(b.namespaceURI,"patches"),b.appendChild(e),b=Po(e.namespaceURI,"PolygonPatch"),e.appendChild(b),this.Xe(b,c,d))};
l.Se=function(b,c,d){var e=d[d.length-1].srsName;"LineStringSegment"!==b.nodeName&&e&&b.setAttribute("srsName",e);"LineString"===b.nodeName||"LineStringSegment"===b.nodeName?(e=Po(b.namespaceURI,"posList"),b.appendChild(e),Ms(e,c,d)):"Curve"===b.nodeName&&(e=Po(b.namespaceURI,"segments"),b.appendChild(e),b=Po(e.namespaceURI,"LineStringSegment"),e.appendChild(b),this.Se(b,c,d))};
l.Fi=function(b,c,d){var e=d[d.length-1],f=e.srsName,e=e.surface;f&&b.setAttribute("srsName",f);c=c.ee();up({node:b,srsName:f,surface:e},Ps,this.c,c,d,void 0,this)};l.op=function(b,c,d){var e=d[d.length-1].srsName;e&&b.setAttribute("srsName",e);c=c.xe();up({node:b,srsName:e},Qs,pp("pointMember"),c,d,void 0,this)};l.Ei=function(b,c,d){var e=d[d.length-1],f=e.srsName,e=e.curve;f&&b.setAttribute("srsName",f);c=c.ud();up({node:b,srsName:f,curve:e},Rs,this.c,c,d,void 0,this)};
l.Hi=function(b,c,d){var e=Po(b.namespaceURI,"LinearRing");b.appendChild(e);this.Di(e,c,d)};l.Ii=function(b,c,d){var e=this.b(c,d);e&&(b.appendChild(e),this.Xe(e,c,d))};l.pp=function(b,c,d){var e=Po(b.namespaceURI,"Point");b.appendChild(e);this.Gi(e,c,d)};l.Ci=function(b,c,d){var e=this.b(c,d);e&&(b.appendChild(e),this.Se(e,c,d))};
l.Ve=function(b,c,d){var e=d[d.length-1],f=Rb(e);f.node=b;var g;ia(c)?e.dataProjection?g=Ze(c,e.featureProjection,e.dataProjection):g=c:g=Vr(c,!0,e);up(f,Ss,this.b,[g],d,void 0,this)};
l.yi=function(b,c,d){var e=c.Qa();e&&b.setAttribute("fid",e);var e=d[d.length-1],f=e.featureNS,g=c.a;e.Bc||(e.Bc={},e.Bc[f]={});var h=c.R();c=[];var k=[],m;for(m in h){var n=h[m];null!==n&&(c.push(m),k.push(n),m==g||n instanceof $e?m in e.Bc[f]||(e.Bc[f][m]=O(this.Ve,this)):m in e.Bc[f]||(e.Bc[f][m]=O(Hs)))}m=Rb(e);m.node=b;up(m,e.Bc,pp(void 0,f),k,d,c)};
var Ps={"http://www.opengis.net/gml":{surfaceMember:O(Ls.prototype.Ii),polygonMember:O(Ls.prototype.Ii)}},Qs={"http://www.opengis.net/gml":{pointMember:O(Ls.prototype.pp)}},Rs={"http://www.opengis.net/gml":{lineStringMember:O(Ls.prototype.Ci),curveMember:O(Ls.prototype.Ci)}},Os={"http://www.opengis.net/gml":{exterior:O(Ls.prototype.Hi),interior:O(Ls.prototype.Hi)}},Ss={"http://www.opengis.net/gml":{Curve:O(Ls.prototype.Se),MultiCurve:O(Ls.prototype.Ei),Point:O(Ls.prototype.Gi),MultiPoint:O(Ls.prototype.op),
LineString:O(Ls.prototype.Se),MultiLineString:O(Ls.prototype.Ei),LinearRing:O(Ls.prototype.Di),Polygon:O(Ls.prototype.Xe),MultiPolygon:O(Ls.prototype.Fi),Surface:O(Ls.prototype.Xe),MultiSurface:O(Ls.prototype.Fi),Envelope:O(Ls.prototype.np)}},Ts={MultiLineString:"lineStringMember",MultiCurve:"curveMember",MultiPolygon:"polygonMember",MultiSurface:"surfaceMember"};Ls.prototype.c=function(b,c){return Po("http://www.opengis.net/gml",Ts[c[c.length-1].node.nodeName])};
Ls.prototype.b=function(b,c){var d=c[c.length-1],e=d.multiSurface,f=d.surface,g=d.curve,d=d.multiCurve,h;ia(b)?h="Envelope":(h=b.V(),"MultiPolygon"===h&&!0===e?h="MultiSurface":"Polygon"===h&&!0===f?h="Surface":"LineString"===h&&!0===g?h="Curve":"MultiLineString"===h&&!0===d&&(h="MultiCurve"));return Po("http://www.opengis.net/gml",h)};
Ls.prototype.o=function(b,c){c=Ur(this,c);var d=Po("http://www.opengis.net/gml","geom"),e={node:d,srsName:this.srsName,curve:this.g,surface:this.l,multiSurface:this.j,multiCurve:this.i};c&&Ub(e,c);this.Ve(d,b,[e]);return d};
Ls.prototype.f=function(b,c){c=Ur(this,c);var d=Po("http://www.opengis.net/gml","featureMembers");ip(d,"http://www.w3.org/2001/XMLSchema-instance","xsi:schemaLocation",this.schemaLocation);var e={srsName:this.srsName,curve:this.g,surface:this.l,multiSurface:this.j,multiCurve:this.i,featureNS:this.featureNS,featureType:this.featureType};c&&Ub(e,c);var e=[e],f=e[e.length-1],g=f.featureType,h=f.featureNS,k={};k[h]={};k[h][g]=O(this.yi,this);f=Rb(f);f.node=d;up(f,k,pp(g,h),b,e);return d};function Us(b){b=b?b:{};this.defaultDataProjection=null;this.defaultDataProjection=Ee("EPSG:4326");this.a=b.readExtensions}z(Us,vs);var Vs=[null,"http://www.topografix.com/GPX/1/0","http://www.topografix.com/GPX/1/1"];function Ws(b,c,d){b.push(parseFloat(c.getAttribute("lon")),parseFloat(c.getAttribute("lat")));"ele"in d?(b.push(d.ele),delete d.ele):b.push(0);"time"in d?(b.push(d.time),delete d.time):b.push(0);return b}
function Xs(b,c){var d=c[c.length-1],e=b.getAttribute("href");null!==e&&(d.link=e);tp(Ys,b,c)}function Zs(b,c){c[c.length-1].extensionsNode_=b}function $s(b,c){var d=c[0],e=S({flatCoordinates:[]},at,b,c);if(e){var f=e.flatCoordinates;delete e.flatCoordinates;var g=new U(null);g.ba("XYZM",f);Vr(g,!1,d);d=new un(g);d.I(e);return d}}
function bt(b,c){var d=c[0],e=S({flatCoordinates:[],ends:[]},ct,b,c);if(e){var f=e.flatCoordinates;delete e.flatCoordinates;var g=e.ends;delete e.ends;var h=new V(null);h.ba("XYZM",f,g);Vr(h,!1,d);d=new un(h);d.I(e);return d}}function dt(b,c){var d=c[0],e=S({},et,b,c);if(e){var f=Ws([],b,e),f=new F(f,"XYZM");Vr(f,!1,d);d=new un(f);d.I(e);return d}}
var ft={rte:$s,trk:bt,wpt:dt},gt=Q(Vs,{rte:lp($s),trk:lp(bt),wpt:lp(dt)}),Ys=Q(Vs,{text:N(W,"linkText"),type:N(W,"linkType")}),at=Q(Vs,{name:N(W),cmt:N(W),desc:N(W),src:N(W),link:Xs,number:N(Es),extensions:Zs,type:N(W),rtept:function(b,c){var d=S({},ht,b,c);d&&Ws(c[c.length-1].flatCoordinates,b,d)}}),ht=Q(Vs,{ele:N(Cs),time:N(Bs)}),ct=Q(Vs,{name:N(W),cmt:N(W),desc:N(W),src:N(W),link:Xs,number:N(Es),type:N(W),extensions:Zs,trkseg:function(b,c){var d=c[c.length-1];tp(it,b,c);d.ends.push(d.flatCoordinates.length)}}),
it=Q(Vs,{trkpt:function(b,c){var d=S({},jt,b,c);d&&Ws(c[c.length-1].flatCoordinates,b,d)}}),jt=Q(Vs,{ele:N(Cs),time:N(Bs)}),et=Q(Vs,{ele:N(Cs),time:N(Bs),magvar:N(Cs),geoidheight:N(Cs),name:N(W),cmt:N(W),desc:N(W),src:N(W),link:Xs,sym:N(W),type:N(W),fix:N(W),sat:N(Es),hdop:N(Cs),vdop:N(Cs),pdop:N(Cs),ageofdgpsdata:N(Cs),dgpsid:N(Es),extensions:Zs});
function kt(b,c){c||(c=[]);for(var d=0,e=c.length;d<e;++d){var f=c[d];if(b.a){var g=f.get("extensionsNode_")||null;b.a(f,g)}f.set("extensionsNode_",void 0)}}Us.prototype.Kh=function(b,c){if(!ub(Vs,b.namespaceURI))return null;var d=ft[b.localName];if(!d)return null;d=d(b,[Tr(this,b,c)]);if(!d)return null;kt(this,[d]);return d};Us.prototype.jc=function(b,c){if(!ub(Vs,b.namespaceURI))return[];if("gpx"==b.localName){var d=S([],gt,b,[Tr(this,b,c)]);if(d)return kt(this,d),d}return[]};
function lt(b,c,d){b.setAttribute("href",c);c=d[d.length-1].properties;up({node:b},mt,rp,[c.linkText,c.linkType],d,nt)}function ot(b,c,d){var e=d[d.length-1],f=e.node.namespaceURI,g=e.properties;ip(b,null,"lat",c[1]);ip(b,null,"lon",c[0]);switch(e.geometryLayout){case "XYZM":0!==c[3]&&(g.time=c[3]);case "XYZ":0!==c[2]&&(g.ele=c[2]);break;case "XYM":0!==c[2]&&(g.time=c[2])}c=pt[f];e=sp(g,c);up({node:b,properties:g},qt,rp,e,d,c)}
var nt=["text","type"],mt=Q(Vs,{text:O(Hs),type:O(Hs)}),rt=Q(Vs,"name cmt desc src link number type rtept".split(" ")),st=Q(Vs,{name:O(Hs),cmt:O(Hs),desc:O(Hs),src:O(Hs),link:O(lt),number:O(Js),type:O(Hs),rtept:op(O(ot))}),tt=Q(Vs,"name cmt desc src link number type trkseg".split(" ")),wt=Q(Vs,{name:O(Hs),cmt:O(Hs),desc:O(Hs),src:O(Hs),link:O(lt),number:O(Js),type:O(Hs),trkseg:op(O(function(b,c,d){up({node:b,geometryLayout:c.b,properties:{}},ut,vt,c.Z(),d)}))}),vt=pp("trkpt"),ut=Q(Vs,{trkpt:O(ot)}),
pt=Q(Vs,"ele time magvar geoidheight name cmt desc src link sym type fix sat hdop vdop pdop ageofdgpsdata dgpsid".split(" ")),qt=Q(Vs,{ele:O(Is),time:O(function(b,c){var d=new Date(1E3*c),d=d.getUTCFullYear()+"-"+Oa(d.getUTCMonth()+1)+"-"+Oa(d.getUTCDate())+"T"+Oa(d.getUTCHours())+":"+Oa(d.getUTCMinutes())+":"+Oa(d.getUTCSeconds())+"Z";b.appendChild(Mo.createTextNode(d))}),magvar:O(Is),geoidheight:O(Is),name:O(Hs),cmt:O(Hs),desc:O(Hs),src:O(Hs),link:O(lt),sym:O(Hs),type:O(Hs),fix:O(Hs),sat:O(Js),
hdop:O(Is),vdop:O(Is),pdop:O(Is),ageofdgpsdata:O(Is),dgpsid:O(Js)}),xt={Point:"wpt",LineString:"rte",MultiLineString:"trk"};function yt(b,c){var d=b.W();if(d&&(d=xt[d.V()]))return Po(c[c.length-1].node.namespaceURI,d)}
var zt=Q(Vs,{rte:O(function(b,c,d){var e=d[0],f=c.R();b={node:b,properties:f};if(c=c.W())c=Vr(c,!0,e),b.geometryLayout=c.b,f.rtept=c.Z();e=rt[d[d.length-1].node.namespaceURI];f=sp(f,e);up(b,st,rp,f,d,e)}),trk:O(function(b,c,d){var e=d[0],f=c.R();b={node:b,properties:f};if(c=c.W())c=Vr(c,!0,e),f.trkseg=c.ud();e=tt[d[d.length-1].node.namespaceURI];f=sp(f,e);up(b,wt,rp,f,d,e)}),wpt:O(function(b,c,d){var e=d[0],f=d[d.length-1];f.properties=c.R();if(c=c.W())c=Vr(c,!0,e),f.geometryLayout=c.b,ot(b,c.Z(),
d)})});Us.prototype.f=function(b,c){c=Ur(this,c);var d=Po("http://www.topografix.com/GPX/1/1","gpx");up({node:d},zt,yt,b,[c]);return d};function At(b){b=Bt(b);return cb(b,function(b){return b.b.substring(b.f,b.a)})}function Ct(b,c,d){this.b=b;this.f=c;this.a=d}function Bt(b){for(var c=RegExp("\r\n|\r|\n","g"),d=0,e,f=[];e=c.exec(b);)d=new Ct(b,d,e.index),f.push(d),d=c.lastIndex;d<b.length&&(d=new Ct(b,d,b.length),f.push(d));return f};function Dt(){this.defaultDataProjection=null}z(Dt,Sr);l=Dt.prototype;l.V=function(){return"text"};l.Ub=function(b,c){return this.Fd(la(b)?b:"",Ur(this,c))};l.Ca=function(b,c){return this.Pf(la(b)?b:"",Ur(this,c))};l.Uc=function(b,c){return this.Hd(la(b)?b:"",Ur(this,c))};l.Ka=function(){return this.defaultDataProjection};l.Ld=function(b,c){return this.Te(b,Ur(this,c))};l.Wb=function(b,c){return this.zi(b,Ur(this,c))};l.Zc=function(b,c){return this.Md(b,Ur(this,c))};function Et(b){b=b?b:{};this.defaultDataProjection=null;this.defaultDataProjection=Ee("EPSG:4326");this.a=b.altitudeMode?b.altitudeMode:"none"}z(Et,Dt);var Ft=/^B(\d{2})(\d{2})(\d{2})(\d{2})(\d{5})([NS])(\d{3})(\d{5})([EW])([AV])(\d{5})(\d{5})/,Gt=/^H.([A-Z]{3}).*?:(.*)/,Ht=/^HFDTE(\d{2})(\d{2})(\d{2})/;
Et.prototype.Fd=function(b,c){var d=this.a,e=At(b),f={},g=[],h=2E3,k=0,m=1,n,p;n=0;for(p=e.length;n<p;++n){var q=e[n],r;if("B"==q.charAt(0)){if(r=Ft.exec(q)){var q=parseInt(r[1],10),t=parseInt(r[2],10),v=parseInt(r[3],10),x=parseInt(r[4],10)+parseInt(r[5],10)/6E4;"S"==r[6]&&(x=-x);var C=parseInt(r[7],10)+parseInt(r[8],10)/6E4;"W"==r[9]&&(C=-C);g.push(C,x);"none"!=d&&g.push("gps"==d?parseInt(r[11],10):"barometric"==d?parseInt(r[12],10):0);g.push(Date.UTC(h,k,m,q,t,v)/1E3)}}else if("H"==q.charAt(0))if(r=
Ht.exec(q))m=parseInt(r[1],10),k=parseInt(r[2],10)-1,h=2E3+parseInt(r[3],10);else if(r=Gt.exec(q))f[r[1]]=r[2].trim(),Ht.exec(q)}if(0===g.length)return null;e=new U(null);e.ba("none"==d?"XYM":"XYZM",g);d=new un(Vr(e,!1,c));d.I(f);return d};Et.prototype.Pf=function(b,c){var d=this.Fd(b,c);return d?[d]:[]};function It(b,c){this.f=this.j=this.c="";this.l=null;this.g=this.a="";this.i=!1;var d;b instanceof It?(this.i=ca(c)?c:b.i,Jt(this,b.c),this.j=b.j,this.f=b.f,Kt(this,b.l),this.a=b.a,Lt(this,b.b.clone()),this.g=b.g):b&&(d=String(b).match(ko))?(this.i=!!c,Jt(this,d[1]||"",!0),this.j=Mt(d[2]||""),this.f=Mt(d[3]||"",!0),Kt(this,d[4]),this.a=Mt(d[5]||"",!0),Lt(this,d[6]||"",!0),this.g=Mt(d[7]||"")):(this.i=!!c,this.b=new Nt(null,0,this.i))}
It.prototype.toString=function(){var b=[],c=this.c;c&&b.push(Ot(c,Pt,!0),":");var d=this.f;if(d||"file"==c)b.push("//"),(c=this.j)&&b.push(Ot(c,Pt,!0),"@"),b.push(encodeURIComponent(String(d)).replace(/%25([0-9a-fA-F]{2})/g,"%$1")),d=this.l,null!=d&&b.push(":",String(d));if(d=this.a)this.f&&"/"!=d.charAt(0)&&b.push("/"),b.push(Ot(d,"/"==d.charAt(0)?Qt:Rt,!0));(d=this.b.toString())&&b.push("?",d);(d=this.g)&&b.push("#",Ot(d,St));return b.join("")};It.prototype.clone=function(){return new It(this)};
function Jt(b,c,d){b.c=d?Mt(c,!0):c;b.c&&(b.c=b.c.replace(/:$/,""))}function Kt(b,c){if(c){c=Number(c);if(isNaN(c)||0>c)throw Error("Bad port number "+c);b.l=c}else b.l=null}function Lt(b,c,d){c instanceof Nt?(b.b=c,Tt(b.b,b.i)):(d||(c=Ot(c,Ut)),b.b=new Nt(c,0,b.i))}function Vt(b){return b instanceof It?b.clone():new It(b,void 0)}
function Wt(b,c){b instanceof It||(b=Vt(b));c instanceof It||(c=Vt(c));var d=b,e=c,f=d.clone(),g=!!e.c;g?Jt(f,e.c):g=!!e.j;g?f.j=e.j:g=!!e.f;g?f.f=e.f:g=null!=e.l;var h=e.a;if(g)Kt(f,e.l);else if(g=!!e.a)if("/"!=h.charAt(0)&&(d.f&&!d.a?h="/"+h:(d=f.a.lastIndexOf("/"),-1!=d&&(h=f.a.substr(0,d+1)+h))),d=h,".."==d||"."==d)h="";else if(-1!=d.indexOf("./")||-1!=d.indexOf("/.")){for(var h=0==d.lastIndexOf("/",0),d=d.split("/"),k=[],m=0;m<d.length;){var n=d[m++];"."==n?h&&m==d.length&&k.push(""):".."==n?
((1<k.length||1==k.length&&""!=k[0])&&k.pop(),h&&m==d.length&&k.push("")):(k.push(n),h=!0)}h=k.join("/")}else h=d;g?f.a=h:g=""!==e.b.toString();g?Lt(f,Mt(e.b.toString())):g=!!e.g;g&&(f.g=e.g);return f}function Mt(b,c){return b?c?decodeURI(b.replace(/%25/g,"%2525")):decodeURIComponent(b):""}function Ot(b,c,d){return la(b)?(b=encodeURI(b).replace(c,Xt),d&&(b=b.replace(/%25([0-9a-fA-F]{2})/g,"%$1")),b):null}function Xt(b){b=b.charCodeAt(0);return"%"+(b>>4&15).toString(16)+(b&15).toString(16)}
var Pt=/[#\/\?@]/g,Rt=/[\#\?:]/g,Qt=/[\#\?]/g,Ut=/[\#\?@]/g,St=/#/g;function Nt(b,c,d){this.f=this.a=null;this.b=b||null;this.c=!!d}function Yt(b){b.a||(b.a=new oi,b.f=0,b.b&&lo(b.b,function(c,d){var e=decodeURIComponent(c.replace(/\+/g," "));Yt(b);b.b=null;var e=Zt(b,e),f=b.a.get(e);f||b.a.set(e,f=[]);f.push(d);b.f++}))}l=Nt.prototype;l.sc=function(){Yt(this);return this.f};
l.remove=function(b){Yt(this);b=Zt(this,b);return qi(this.a.f,b)?(this.b=null,this.f-=this.a.get(b).length,this.a.remove(b)):!1};l.clear=function(){this.a=this.b=null;this.f=0};l.Na=function(){Yt(this);return 0==this.f};function $t(b,c){Yt(b);c=Zt(b,c);return qi(b.a.f,c)}l.P=function(){Yt(this);for(var b=this.a.wc(),c=this.a.P(),d=[],e=0;e<c.length;e++)for(var f=b[e],g=0;g<f.length;g++)d.push(c[e]);return d};
l.wc=function(b){Yt(this);var c=[];if(la(b))$t(this,b)&&(c=hb(c,this.a.get(Zt(this,b))));else{b=this.a.wc();for(var d=0;d<b.length;d++)c=hb(c,b[d])}return c};l.set=function(b,c){Yt(this);this.b=null;b=Zt(this,b);$t(this,b)&&(this.f-=this.a.get(b).length);this.a.set(b,[c]);this.f++;return this};l.get=function(b,c){var d=b?this.wc(b):[];return 0<d.length?String(d[0]):c};function au(b,c,d){b.remove(c);0<d.length&&(b.b=null,b.a.set(Zt(b,c),ib(d)),b.f+=d.length)}
l.toString=function(){if(this.b)return this.b;if(!this.a)return"";for(var b=[],c=this.a.P(),d=0;d<c.length;d++)for(var e=c[d],f=encodeURIComponent(String(e)),e=this.wc(e),g=0;g<e.length;g++){var h=f;""!==e[g]&&(h+="="+encodeURIComponent(String(e[g])));b.push(h)}return this.b=b.join("&")};l.clone=function(){var b=new Nt;b.b=this.b;this.a&&(b.a=this.a.clone(),b.f=this.f);return b};function Zt(b,c){var d=String(c);b.c&&(d=d.toLowerCase());return d}
function Tt(b,c){c&&!b.c&&(Yt(b),b.b=null,b.a.forEach(function(b,c){var f=c.toLowerCase();c!=f&&(this.remove(c),au(this,f,b))},b));b.c=c};function bu(b){b=b||{};this.b=b.font;this.i=b.rotation;this.f=b.scale;this.G=b.text;this.l=b.textAlign;this.o=b.textBaseline;this.a=void 0!==b.fill?b.fill:new Vl({color:"#333"});this.j=void 0!==b.stroke?b.stroke:null;this.c=void 0!==b.offsetX?b.offsetX:0;this.g=void 0!==b.offsetY?b.offsetY:0}l=bu.prototype;l.Tj=function(){return this.b};l.gk=function(){return this.c};l.hk=function(){return this.g};l.In=function(){return this.a};l.Jn=function(){return this.i};l.Kn=function(){return this.f};l.Ln=function(){return this.j};
l.Da=function(){return this.G};l.uk=function(){return this.l};l.vk=function(){return this.o};l.To=function(b){this.b=b};l.ji=function(b){this.c=b};l.ki=function(b){this.g=b};l.So=function(b){this.a=b};l.Mn=function(b){this.i=b};l.Nn=function(b){this.f=b};l.Zo=function(b){this.j=b};l.mi=function(b){this.G=b};l.ni=function(b){this.l=b};l.$o=function(b){this.o=b};function cu(b){b=b?b:{};this.defaultDataProjection=null;this.defaultDataProjection=Ee("EPSG:4326");this.b=b.defaultStyle?b.defaultStyle:du;this.c=void 0!==b.extractStyles?b.extractStyles:!0;this.i=void 0!==b.writeStyles?b.writeStyles:!0;this.a={};this.g=void 0!==b.showPointNames?b.showPointNames:!0}z(cu,vs);
var eu=["http://www.google.com/kml/ext/2.2"],fu=[null,"http://earth.google.com/kml/2.0","http://earth.google.com/kml/2.1","http://earth.google.com/kml/2.2","http://www.opengis.net/kml/2.2"],gu=[255,255,255,1],hu=new Vl({color:gu}),iu=[20,2],ju=[64,64],ku=new sk({anchor:iu,anchorOrigin:"bottom-left",anchorXUnits:"pixels",anchorYUnits:"pixels",crossOrigin:"anonymous",rotation:0,scale:.5,size:ju,src:"https://maps.google.com/mapfiles/kml/pushpin/ylw-pushpin.png"}),lu=new am({color:gu,width:1}),mu=new bu({font:"bold 16px Helvetica",
fill:hu,stroke:new am({color:[51,51,51,1],width:2}),scale:.8}),du=[new em({fill:hu,image:ku,text:mu,stroke:lu,zIndex:0})],nu={fraction:"fraction",pixels:"pixels"};function ou(b,c){var d=null,e=[0,0],f="start";b.f&&(d=b.f.td())&&2==d.length&&(e[0]=b.f.j*d[0]/2,e[1]=-b.f.j*d[1]/2,f="left");Nb(b.Da())?d=new bu({text:c,offsetX:e[0],offsetY:e[1],textAlign:f}):(d=Rb(b.Da()),d.mi(c),d.ni(f),d.ji(e[0]),d.ki(e[1]));return new em({text:d})}
function pu(b,c,d,e,f){return function(){var g=f,h="";g&&this.W()&&(g="Point"===this.W().V());g&&(h=this.R().name,g=g&&h);if(b)return g?(g=ou(b[0],h),b.concat(g)):b;if(c){var k=qu(c,d,e);return g?(g=ou(k[0],h),k.concat(g)):k}return g?(g=ou(d[0],h),d.concat(g)):d}}function qu(b,c,d){return ia(b)?b:la(b)?(!(b in d)&&"#"+b in d&&(b="#"+b),qu(d[b],c,d)):c}
function ru(b){b=Qo(b,!1);if(b=/^\s*#?\s*([0-9A-Fa-f]{8})\s*$/.exec(b))return b=b[1],[parseInt(b.substr(6,2),16),parseInt(b.substr(4,2),16),parseInt(b.substr(2,2),16),parseInt(b.substr(0,2),16)/255]}function su(b){b=Qo(b,!1);for(var c=[],d=/^\s*([+\-]?\d*\.?\d+(?:e[+\-]?\d+)?)\s*,\s*([+\-]?\d*\.?\d+(?:e[+\-]?\d+)?)(?:\s*,\s*([+\-]?\d*\.?\d+(?:e[+\-]?\d+)?))?\s*/i,e;e=d.exec(b);)c.push(parseFloat(e[1]),parseFloat(e[2]),e[3]?parseFloat(e[3]):0),b=b.substr(e[0].length);return""!==b?void 0:c}
function tu(b){var c=Qo(b,!1);return b.baseURI?Wt(b.baseURI,c.trim()).toString():c.trim()}function uu(b){b=Cs(b);if(void 0!==b)return Math.sqrt(b)}function vu(b,c){return S(null,wu,b,c)}function xu(b,c){var d=S({A:[],wi:[]},yu,b,c);if(d){var e=d.A,d=d.wi,f,g;f=0;for(g=Math.min(e.length,d.length);f<g;++f)e[4*f+3]=d[f];d=new U(null);d.ba("XYZM",e);return d}}function zu(b,c){var d=S({},Au,b,c),e=S(null,Bu,b,c);if(e){var f=new U(null);f.ba("XYZ",e);f.I(d);return f}}
function Cu(b,c){var d=S({},Au,b,c),e=S(null,Bu,b,c);if(e){var f=new G(null);f.ba("XYZ",e,[e.length]);f.I(d);return f}}
function Du(b,c){var d=S([],Eu,b,c);if(!d)return null;if(0===d.length)return new ms(d);var e=!0,f=d[0].V(),g,h,k;h=1;for(k=d.length;h<k;++h)if(g=d[h],g.V()!=f){e=!1;break}if(e){if("Point"==f){g=d[0];e=g.b;f=g.ja();h=1;for(k=d.length;h<k;++h)g=d[h],jb(f,g.ja());g=new bs(null);g.ba(e,f);Fu(g,d);return g}return"LineString"==f?(g=new V(null),as(g,d),Fu(g,d),g):"Polygon"==f?(g=new cs(null),es(g,d),Fu(g,d),g):"GeometryCollection"==f?new ms(d):null}return new ms(d)}
function Gu(b,c){var d=S({},Au,b,c),e=S(null,Bu,b,c);if(e){var f=new F(null);f.ba("XYZ",e);f.I(d);return f}}function Hu(b,c){var d=S({},Au,b,c),e=S([null],Iu,b,c);if(e&&e[0]){var f=new G(null),g=e[0],h=[g.length],k,m;k=1;for(m=e.length;k<m;++k)jb(g,e[k]),h.push(g.length);f.ba("XYZ",g,h);f.I(d);return f}}
function Ju(b,c){var d=S({},Ku,b,c);if(!d)return null;var e="fillStyle"in d?d.fillStyle:hu,f=d.fill;void 0===f||f||(e=null);var f="imageStyle"in d?d.imageStyle:ku,g="textStyle"in d?d.textStyle:mu,h="strokeStyle"in d?d.strokeStyle:lu,d=d.outline;void 0===d||d||(h=null);return[new em({fill:e,image:f,stroke:h,text:g,zIndex:void 0})]}
function Fu(b,c){var d=c.length,e=Array(c.length),f=Array(c.length),g,h,k,m;k=m=!1;for(h=0;h<d;++h)g=c[h],e[h]=g.get("extrude"),f[h]=g.get("altitudeMode"),k=k||void 0!==e[h],m=m||f[h];k&&b.set("extrude",e);m&&b.set("altitudeMode",f)}function Lu(b,c){tp(Mu,b,c)}
var Nu=Q(fu,{value:mp(W)}),Mu=Q(fu,{Data:function(b,c){var d=b.getAttribute("name");if(null!==d){var e=S(void 0,Nu,b,c);e&&(c[c.length-1][d]=e)}},SchemaData:function(b,c){tp(Ou,b,c)}}),Au=Q(fu,{extrude:N(zs),altitudeMode:N(W)}),wu=Q(fu,{coordinates:mp(su)}),Iu=Q(fu,{innerBoundaryIs:function(b,c){var d=S(void 0,Pu,b,c);d&&c[c.length-1].push(d)},outerBoundaryIs:function(b,c){var d=S(void 0,Qu,b,c);d&&(c[c.length-1][0]=d)}}),yu=Q(fu,{when:function(b,c){var d=c[c.length-1].wi,e=Qo(b,!1);if(e=/^\s*(\d{4})($|-(\d{2})($|-(\d{2})($|T(\d{2}):(\d{2}):(\d{2})(Z|(?:([+\-])(\d{2})(?::(\d{2}))?)))))\s*$/.exec(e)){var f=
Date.UTC(parseInt(e[1],10),e[3]?parseInt(e[3],10)-1:0,e[5]?parseInt(e[5],10):1,e[7]?parseInt(e[7],10):0,e[8]?parseInt(e[8],10):0,e[9]?parseInt(e[9],10):0);if(e[10]&&"Z"!=e[10]){var g="-"==e[11]?-1:1,f=f+60*g*parseInt(e[12],10);e[13]&&(f+=3600*g*parseInt(e[13],10))}d.push(f)}else d.push(0)}},Q(eu,{coord:function(b,c){var d=c[c.length-1].A,e=Qo(b,!1);(e=/^\s*([+\-]?\d+(?:\.\d*)?(?:e[+\-]?\d*)?)\s+([+\-]?\d+(?:\.\d*)?(?:e[+\-]?\d*)?)\s+([+\-]?\d+(?:\.\d*)?(?:e[+\-]?\d*)?)\s*$/i.exec(e))?d.push(parseFloat(e[1]),
parseFloat(e[2]),parseFloat(e[3]),0):d.push(0,0,0,0)}})),Bu=Q(fu,{coordinates:mp(su)}),Ru=Q(fu,{href:N(tu)},Q(eu,{x:N(Cs),y:N(Cs),w:N(Cs),h:N(Cs)})),Su=Q(fu,{Icon:N(function(b,c){var d=S({},Ru,b,c);return d?d:null}),heading:N(Cs),hotSpot:N(function(b){var c=b.getAttribute("xunits"),d=b.getAttribute("yunits");return{x:parseFloat(b.getAttribute("x")),dg:nu[c],y:parseFloat(b.getAttribute("y")),eg:nu[d]}}),scale:N(uu)}),Pu=Q(fu,{LinearRing:mp(vu)}),Tu=Q(fu,{color:N(ru),scale:N(uu)}),Uu=Q(fu,{color:N(ru),
width:N(Cs)}),Eu=Q(fu,{LineString:lp(zu),LinearRing:lp(Cu),MultiGeometry:lp(Du),Point:lp(Gu),Polygon:lp(Hu)}),Vu=Q(eu,{Track:lp(xu)}),Xu=Q(fu,{ExtendedData:Lu,Link:function(b,c){tp(Wu,b,c)},address:N(W),description:N(W),name:N(W),open:N(zs),phoneNumber:N(W),visibility:N(zs)}),Wu=Q(fu,{href:N(tu)}),Qu=Q(fu,{LinearRing:mp(vu)}),Yu=Q(fu,{Style:N(Ju),key:N(W),styleUrl:N(function(b){var c=Qo(b,!1).trim();return b.baseURI?Wt(b.baseURI,c).toString():c})}),$u=Q(fu,{ExtendedData:Lu,MultiGeometry:N(Du,"geometry"),
LineString:N(zu,"geometry"),LinearRing:N(Cu,"geometry"),Point:N(Gu,"geometry"),Polygon:N(Hu,"geometry"),Style:N(Ju),StyleMap:function(b,c){var d=S(void 0,Zu,b,c);if(d){var e=c[c.length-1];ia(d)?e.Style=d:la(d)&&(e.styleUrl=d)}},address:N(W),description:N(W),name:N(W),open:N(zs),phoneNumber:N(W),styleUrl:N(tu),visibility:N(zs)},Q(eu,{MultiTrack:N(function(b,c){var d=S([],Vu,b,c);if(d){var e=new V(null);as(e,d);return e}},"geometry"),Track:N(xu,"geometry")})),av=Q(fu,{color:N(ru),fill:N(zs),outline:N(zs)}),
Ou=Q(fu,{SimpleData:function(b,c){var d=b.getAttribute("name");if(null!==d){var e=W(b);c[c.length-1][d]=e}}}),Ku=Q(fu,{IconStyle:function(b,c){var d=S({},Su,b,c);if(d){var e=c[c.length-1],f="Icon"in d?d.Icon:{},g;g=(g=f.href)?g:"https://maps.google.com/mapfiles/kml/pushpin/ylw-pushpin.png";var h,k,m,n=d.hotSpot;n?(h=[n.x,n.y],k=n.dg,m=n.eg):"https://maps.google.com/mapfiles/kml/pushpin/ylw-pushpin.png"===g?(h=iu,m=k="pixels"):/^http:\/\/maps\.(?:google|gstatic)\.com\//.test(g)&&(h=[.5,0],m=k="fraction");
var p,n=f.x,q=f.y;void 0!==n&&void 0!==q&&(p=[n,q]);var r,n=f.w,f=f.h;void 0!==n&&void 0!==f&&(r=[n,f]);var t,f=d.heading;void 0!==f&&(t=Wa(f));d=d.scale;"https://maps.google.com/mapfiles/kml/pushpin/ylw-pushpin.png"==g&&(r=ju,void 0===d&&(d=.5));h=new sk({anchor:h,anchorOrigin:"bottom-left",anchorXUnits:k,anchorYUnits:m,crossOrigin:"anonymous",offset:p,offsetOrigin:"bottom-left",rotation:t,scale:d,size:r,src:g});e.imageStyle=h}},LabelStyle:function(b,c){var d=S({},Tu,b,c);d&&(c[c.length-1].textStyle=
new bu({fill:new Vl({color:"color"in d?d.color:gu}),scale:d.scale}))},LineStyle:function(b,c){var d=S({},Uu,b,c);d&&(c[c.length-1].strokeStyle=new am({color:"color"in d?d.color:gu,width:"width"in d?d.width:1}))},PolyStyle:function(b,c){var d=S({},av,b,c);if(d){var e=c[c.length-1];e.fillStyle=new Vl({color:"color"in d?d.color:gu});var f=d.fill;void 0!==f&&(e.fill=f);d=d.outline;void 0!==d&&(e.outline=d)}}}),Zu=Q(fu,{Pair:function(b,c){var d=S({},Yu,b,c);if(d){var e=d.key;e&&"normal"==e&&((e=d.styleUrl)&&
(c[c.length-1]=e),(d=d.Style)&&(c[c.length-1]=d))}}});l=cu.prototype;l.Lf=function(b,c){Uo(b);var d=Q(fu,{Document:kp(this.Lf,this),Folder:kp(this.Lf,this),Placemark:lp(this.Tf,this),Style:this.Do.bind(this),StyleMap:this.Co.bind(this)});if(d=S([],d,b,c,this))return d};
l.Tf=function(b,c){var d=S({geometry:null},$u,b,c);if(d){var e=new un,f=b.getAttribute("id");null!==f&&e.kc(f);var f=c[0],g=d.geometry;g&&Vr(g,!1,f);e.Oa(g);delete d.geometry;this.c&&e.Bf(pu(d.Style,d.styleUrl,this.b,this.a,this.g));delete d.Style;e.I(d);return e}};l.Do=function(b,c){var d=b.getAttribute("id");if(null!==d){var e=Ju(b,c);e&&(d=b.baseURI?Wt(b.baseURI,"#"+d).toString():"#"+d,this.a[d]=e)}};
l.Co=function(b,c){var d=b.getAttribute("id");if(null!==d){var e=S(void 0,Zu,b,c);e&&(d=b.baseURI?Wt(b.baseURI,"#"+d).toString():"#"+d,this.a[d]=e)}};l.Kh=function(b,c){if(!ub(fu,b.namespaceURI))return null;var d=this.Tf(b,[Tr(this,b,c)]);return d?d:null};
l.jc=function(b,c){if(!ub(fu,b.namespaceURI))return[];var d;d=Uo(b);if("Document"==d||"Folder"==d)return(d=this.Lf(b,[Tr(this,b,c)]))?d:[];if("Placemark"==d)return(d=this.Tf(b,[Tr(this,b,c)]))?[d]:[];if("kml"==d){d=[];var e;for(e=b.firstElementChild;e;e=e.nextElementSibling){var f=this.jc(e,c);f&&jb(d,f)}return d}return[]};l.xo=function(b){if(Xo(b))return bv(this,b);if($o(b))return cv(this,b);if(la(b))return b=jp(b),bv(this,b)};
function bv(b,c){var d;for(d=c.firstChild;d;d=d.nextSibling)if(1==d.nodeType){var e=cv(b,d);if(e)return e}}function cv(b,c){var d;for(d=c.firstElementChild;d;d=d.nextElementSibling)if(ub(fu,d.namespaceURI)&&"name"==d.localName)return W(d);for(d=c.firstElementChild;d;d=d.nextElementSibling){var e=Uo(d);if(ub(fu,d.namespaceURI)&&("Document"==e||"Folder"==e||"Placemark"==e||"kml"==e)&&(e=cv(b,d)))return e}}
l.yo=function(b){var c=[];Xo(b)?jb(c,dv(this,b)):$o(b)?jb(c,ev(this,b)):la(b)&&(b=jp(b),jb(c,dv(this,b)));return c};function dv(b,c){var d,e=[];for(d=c.firstChild;d;d=d.nextSibling)1==d.nodeType&&jb(e,ev(b,d));return e}
function ev(b,c){var d,e=[];for(d=c.firstElementChild;d;d=d.nextElementSibling)if(ub(fu,d.namespaceURI)&&"NetworkLink"==d.localName){var f=S({},Xu,d,[]);e.push(f)}for(d=c.firstElementChild;d;d=d.nextElementSibling)f=Uo(d),!ub(fu,d.namespaceURI)||"Document"!=f&&"Folder"!=f&&"kml"!=f||jb(e,ev(b,d));return e}function fv(b,c){var d=rg(c),d=[255*(4==d.length?d[3]:1),d[2],d[1],d[0]],e;for(e=0;4>e;++e){var f=parseInt(d[e],10).toString(16);d[e]=1==f.length?"0"+f:f}Hs(b,d.join(""))}
function gv(b,c,d){up({node:b},hv,iv,[c],d)}function jv(b,c,d){var e={node:b};c.Qa()&&b.setAttribute("id",c.Qa());b=c.R();var f=c.cc();if(f&&(f=f.call(c,0))&&0<f.length){var g=f[0];this.i&&(b.Style=f[0]);(f=g.Da())&&(b.name=f.Da())}f=kv[d[d.length-1].node.namespaceURI];b=sp(b,f);up(e,lv,rp,b,d,f);b=d[0];(c=c.W())&&(c=Vr(c,!0,b));up(e,lv,mv,[c],d)}function nv(b,c,d){var e=c.ja();b={node:b};b.layout=c.b;b.stride=c.sa();up(b,ov,pv,[e],d)}
function qv(b,c,d){c=c.de();var e=c.shift();b={node:b};up(b,rv,sv,c,d);up(b,rv,tv,[e],d)}function uv(b,c){Is(b,c*c)}
var vv=Q(fu,["Document","Placemark"]),yv=Q(fu,{Document:O(function(b,c,d){up({node:b},wv,xv,c,d,void 0,this)}),Placemark:O(jv)}),wv=Q(fu,{Placemark:O(jv)}),zv={Point:"Point",LineString:"LineString",LinearRing:"LinearRing",Polygon:"Polygon",MultiPoint:"MultiGeometry",MultiLineString:"MultiGeometry",MultiPolygon:"MultiGeometry"},Av=Q(fu,["href"],Q(eu,["x","y","w","h"])),Bv=Q(fu,{href:O(Hs)},Q(eu,{x:O(Is),y:O(Is),w:O(Is),h:O(Is)})),Cv=Q(fu,["scale","heading","Icon","hotSpot"]),Ev=Q(fu,{Icon:O(function(b,
c,d){b={node:b};var e=Av[d[d.length-1].node.namespaceURI],f=sp(c,e);up(b,Bv,rp,f,d,e);e=Av[eu[0]];f=sp(c,e);up(b,Bv,Dv,f,d,e)}),heading:O(Is),hotSpot:O(function(b,c){b.setAttribute("x",c.x);b.setAttribute("y",c.y);b.setAttribute("xunits",c.dg);b.setAttribute("yunits",c.eg)}),scale:O(uv)}),Fv=Q(fu,["color","scale"]),Gv=Q(fu,{color:O(fv),scale:O(uv)}),Hv=Q(fu,["color","width"]),Iv=Q(fu,{color:O(fv),width:O(Is)}),hv=Q(fu,{LinearRing:O(nv)}),Jv=Q(fu,{LineString:O(nv),Point:O(nv),Polygon:O(qv)}),kv=Q(fu,
"name open visibility address phoneNumber description styleUrl Style".split(" ")),lv=Q(fu,{MultiGeometry:O(function(b,c,d){b={node:b};var e=c.V(),f,g;"MultiPoint"==e?(f=c.xe(),g=Kv):"MultiLineString"==e?(f=c.ud(),g=Lv):"MultiPolygon"==e&&(f=c.ee(),g=Mv);up(b,Jv,g,f,d)}),LineString:O(nv),LinearRing:O(nv),Point:O(nv),Polygon:O(qv),Style:O(function(b,c,d){b={node:b};var e={},f=c.g,g=c.b,h=c.f;c=c.Da();h instanceof sk&&(e.IconStyle=h);c&&(e.LabelStyle=c);g&&(e.LineStyle=g);f&&(e.PolyStyle=f);c=Nv[d[d.length-
1].node.namespaceURI];e=sp(e,c);up(b,Ov,rp,e,d,c)}),address:O(Hs),description:O(Hs),name:O(Hs),open:O(Gs),phoneNumber:O(Hs),styleUrl:O(Hs),visibility:O(Gs)}),ov=Q(fu,{coordinates:O(function(b,c,d){d=d[d.length-1];var e=d.layout;d=d.stride;var f;"XY"==e||"XYM"==e?f=2:("XYZ"==e||"XYZM"==e)&&(f=3);var g,h=c.length,k="";if(0<h){k+=c[0];for(e=1;e<f;++e)k+=","+c[e];for(g=d;g<h;g+=d)for(k+=" "+c[g],e=1;e<f;++e)k+=","+c[g+e]}Hs(b,k)})}),rv=Q(fu,{outerBoundaryIs:O(gv),innerBoundaryIs:O(gv)}),Pv=Q(fu,{color:O(fv)}),
Nv=Q(fu,["IconStyle","LabelStyle","LineStyle","PolyStyle"]),Ov=Q(fu,{IconStyle:O(function(b,c,d){b={node:b};var e={},f=c.Eb(),g=c.td(),h={href:c.a.l};if(f){h.w=f[0];h.h=f[1];var k=c.Yb(),m=c.Ea();m&&g&&0!==m[0]&&m[1]!==f[1]&&(h.x=m[0],h.y=g[1]-(m[1]+f[1]));k&&0!==k[0]&&k[1]!==f[1]&&(e.hotSpot={x:k[0],dg:"pixels",y:f[1]-k[1],eg:"pixels"})}e.Icon=h;f=c.j;1!==f&&(e.scale=f);c=c.G;0!==c&&(e.heading=c);c=Cv[d[d.length-1].node.namespaceURI];e=sp(e,c);up(b,Ev,rp,e,d,c)}),LabelStyle:O(function(b,c,d){b={node:b};
var e={},f=c.a;f&&(e.color=f.a);(c=c.f)&&1!==c&&(e.scale=c);c=Fv[d[d.length-1].node.namespaceURI];e=sp(e,c);up(b,Gv,rp,e,d,c)}),LineStyle:O(function(b,c,d){b={node:b};var e=Hv[d[d.length-1].node.namespaceURI];c=sp({color:c.a,width:c.f},e);up(b,Iv,rp,c,d,e)}),PolyStyle:O(function(b,c,d){up({node:b},Pv,Qv,[c.a],d)})});function Dv(b,c,d){return Po(eu[0],"gx:"+d)}function xv(b,c){return Po(c[c.length-1].node.namespaceURI,"Placemark")}
function mv(b,c){if(b)return Po(c[c.length-1].node.namespaceURI,zv[b.V()])}var Qv=pp("color"),pv=pp("coordinates"),sv=pp("innerBoundaryIs"),Kv=pp("Point"),Lv=pp("LineString"),iv=pp("LinearRing"),Mv=pp("Polygon"),tv=pp("outerBoundaryIs");
cu.prototype.f=function(b,c){c=Ur(this,c);var d=Po(fu[4],"kml");ip(d,"http://www.w3.org/2000/xmlns/","xmlns:gx",eu[0]);ip(d,"http://www.w3.org/2000/xmlns/","xmlns:xsi","http://www.w3.org/2001/XMLSchema-instance");ip(d,"http://www.w3.org/2001/XMLSchema-instance","xsi:schemaLocation","http://www.opengis.net/kml/2.2 https://developers.google.com/kml/schema/kml22gx.xsd");var e={node:d},f={};1<b.length?f.Document=b:1==b.length&&(f.Placemark=b[0]);var g=vv[d.namespaceURI],f=sp(f,g);up(e,yv,rp,f,[c],g,this);
return d};(function(){var b={},c={ka:b};(function(d){if("object"===typeof b&&"undefined"!==typeof c)c.ka=d();else{var e;"undefined"!==typeof window?e=window:"undefined"!==typeof global?e=global:"undefined"!==typeof self?e=self:e=this;e.Ip=d()}})(function(){return function e(b,c,h){function k(n,q){if(!c[n]){if(!b[n]){var r="function"==typeof require&&require;if(!q&&r)return r(n,!0);if(m)return m(n,!0);r=Error("Cannot find module '"+n+"'");throw r.code="MODULE_NOT_FOUND",r;}r=c[n]={ka:{}};b[n][0].call(r.ka,function(c){var e=
b[n][1][c];return k(e?e:c)},r,r.ka,e,b,c,h)}return c[n].ka}for(var m="function"==typeof require&&require,n=0;n<h.length;n++)k(h[n]);return k}({1:[function(b,c){function g(b){var c;b&&b.length&&(c=b,b=c.length);b=new Uint8Array(b||0);c&&b.set(c);b.Vh=m.Vh;b.cg=m.cg;b.Nh=m.Nh;b.Bi=m.Bi;b.Sf=m.Sf;b.Ai=m.Ai;b.Mf=m.Mf;b.xi=m.xi;b.toString=m.toString;b.write=m.write;b.slice=m.slice;b.tg=m.tg;b.jj=!0;return b}function h(b){for(var c=b.length,e=[],f=0,g,h;f<c;f++){g=b.charCodeAt(f);if(55295<g&&57344>g)if(h)if(56320>
g){e.push(239,191,189);h=g;continue}else g=h-55296<<10|g-56320|65536,h=null;else{56319<g||f+1===c?e.push(239,191,189):h=g;continue}else h&&(e.push(239,191,189),h=null);128>g?e.push(g):2048>g?e.push(g>>6|192,g&63|128):65536>g?e.push(g>>12|224,g>>6&63|128,g&63|128):e.push(g>>18|240,g>>12&63|128,g>>6&63|128,g&63|128)}return e}c.ka=g;var k=b("ieee754"),m,n,p;m={Vh:function(b){return(this[b]|this[b+1]<<8|this[b+2]<<16)+16777216*this[b+3]},cg:function(b,c){this[c]=b;this[c+1]=b>>>8;this[c+2]=b>>>16;this[c+
3]=b>>>24},Nh:function(b){return(this[b]|this[b+1]<<8|this[b+2]<<16)+(this[b+3]<<24)},Sf:function(b){return k.read(this,b,!0,23,4)},Mf:function(b){return k.read(this,b,!0,52,8)},Ai:function(b,c){return k.write(this,b,c,!0,23,4)},xi:function(b,c){return k.write(this,b,c,!0,52,8)},toString:function(b,c,e){var f=b="";e=Math.min(this.length,e||this.length);for(c=c||0;c<e;c++){var g=this[c];127>=g?(b+=decodeURIComponent(f)+String.fromCharCode(g),f=""):f+="%"+g.toString(16)}return b+=decodeURIComponent(f)},
write:function(b,c){for(var e=b===n?p:h(b),f=0;f<e.length;f++)this[c+f]=e[f]},slice:function(b,c){return this.subarray(b,c)},tg:function(b,c){c=c||0;for(var e=0;e<this.length;e++)b[c+e]=this[e]}};m.Bi=m.cg;g.byteLength=function(b){n=b;p=h(b);return p.length};g.isBuffer=function(b){return!(!b||!b.jj)}},{ieee754:3}],2:[function(b,c){(function(g){function h(b){this.Hb=k.isBuffer(b)?b:new k(b||0);this.ca=0;this.length=this.Hb.length}c.ka=h;var k=g.qp||b("./buffer");h.c=0;h.b=1;h.a=2;h.f=5;var m=Math.pow(2,
63);h.prototype={Qf:function(b,c,e){for(e=e||this.length;this.ca<e;){var f=this.Aa(),g=this.ca;b(f>>3,c,this);this.ca===g&&this.fp(f)}return c},to:function(){var b=this.Hb.Sf(this.ca);this.ca+=4;return b},po:function(){var b=this.Hb.Mf(this.ca);this.ca+=8;return b},Aa:function(){var b=this.Hb,c,e,f,g,h;c=b[this.ca++];if(128>c)return c;c=c&127;f=b[this.ca++];if(128>f)return c|f<<7;f=(f&127)<<7;g=b[this.ca++];if(128>g)return c|f|g<<14;g=(g&127)<<14;h=b[this.ca++];if(128>h)return c|f|g|h<<21;e=b[this.ca++];
c=(c|f|g|(h&127)<<21)+268435456*(e&127);if(128>e)return c;e=b[this.ca++];c+=34359738368*(e&127);if(128>e)return c;e=b[this.ca++];c+=4398046511104*(e&127);if(128>e)return c;e=b[this.ca++];c+=562949953421312*(e&127);if(128>e)return c;e=b[this.ca++];c+=72057594037927936*(e&127);if(128>e)return c;e=b[this.ca++];c+=0x7fffffffffffffff*(e&127);if(128>e)return c;throw Error("Expected varint not more than 10 bytes");},Eo:function(){var b=this.ca,c=this.Aa();if(c<m)return c;for(var e=this.ca-2;255===this.Hb[e];)e--;
e<b&&(e=b);for(var f=c=0;f<e-b+1;f++)var g=~this.Hb[b+f]&127,c=c+(4>f?g<<7*f:g*Math.pow(2,7*f));return-c-1},Id:function(){var b=this.Aa();return 1===b%2?(b+1)/-2:b/2},no:function(){return Boolean(this.Aa())},Vf:function(){var b=this.Aa()+this.ca,c=this.Hb.toString("utf8",this.ca,b);this.ca=b;return c},fp:function(b){b=b&7;if(b===h.c)for(;127<this.Hb[this.ca++];);else if(b===h.a)this.ca=this.Aa()+this.ca;else if(b===h.f)this.ca+=4;else if(b===h.b)this.ca+=8;else throw Error("Unimplemented type: "+
b);}}}).call(this,"undefined"!==typeof global?global:"undefined"!==typeof self?self:"undefined"!==typeof window?window:{})},{"./buffer":1}],3:[function(b,c,g){g.read=function(b,c,e,f,g){var q;q=8*g-f-1;var r=(1<<q)-1,t=r>>1,v=-7;g=e?g-1:0;var x=e?-1:1,C=b[c+g];g+=x;e=C&(1<<-v)-1;C>>=-v;for(v+=q;0<v;e=256*e+b[c+g],g+=x,v-=8);q=e&(1<<-v)-1;e>>=-v;for(v+=f;0<v;q=256*q+b[c+g],g+=x,v-=8);if(0===e)e=1-t;else{if(e===r)return q?NaN:Infinity*(C?-1:1);q+=Math.pow(2,f);e=e-t}return(C?-1:1)*q*Math.pow(2,e-f)};
g.write=function(b,c,e,f,g,q){var r,t=8*q-g-1,v=(1<<t)-1,x=v>>1,C=23===g?Math.pow(2,-24)-Math.pow(2,-77):0;q=f?0:q-1;var A=f?1:-1,y=0>c||0===c&&0>1/c?1:0;c=Math.abs(c);isNaN(c)||Infinity===c?(c=isNaN(c)?1:0,f=v):(f=Math.floor(Math.log(c)/Math.LN2),1>c*(r=Math.pow(2,-f))&&(f--,r*=2),c=1<=f+x?c+C/r:c+C*Math.pow(2,1-x),2<=c*r&&(f++,r/=2),f+x>=v?(c=0,f=v):1<=f+x?(c=(c*r-1)*Math.pow(2,g),f+=x):(c=c*Math.pow(2,x-1)*Math.pow(2,g),f=0));for(;8<=g;b[e+q]=c&255,q+=A,c/=256,g-=8);f=f<<g|c;for(t+=g;0<t;b[e+q]=
f&255,q+=A,f/=256,t-=8);b[e+q-A]|=128*y}},{}]},{},[2])(2)});Ap=c.ka})();(function(){var b={},c={ka:b};(function(d){if("object"===typeof b&&"undefined"!==typeof c)c.ka=d();else{var e;"undefined"!==typeof window?e=window:"undefined"!==typeof global?e=global:"undefined"!==typeof self?e=self:e=this;e.Kp=d()}})(function(){return function e(b,c,h){function k(n,q){if(!c[n]){if(!b[n]){var r="function"==typeof require&&require;if(!q&&r)return r(n,!0);if(m)return m(n,!0);r=Error("Cannot find module '"+n+"'");throw r.code="MODULE_NOT_FOUND",r;}r=c[n]={ka:{}};b[n][0].call(r.ka,function(c){var e=
b[n][1][c];return k(e?e:c)},r,r.ka,e,b,c,h)}return c[n].ka}for(var m="function"==typeof require&&require,n=0;n<h.length;n++)k(h[n]);return k}({1:[function(b,c){c.ka.bj=b("./lib/vectortile.js");c.ka.Dp=b("./lib/vectortilefeature.js");c.ka.Ep=b("./lib/vectortilelayer.js")},{"./lib/vectortile.js":2,"./lib/vectortilefeature.js":3,"./lib/vectortilelayer.js":4}],2:[function(b,c){function g(b,c,e){3===b&&(b=new h(e,e.Aa()+e.ca),b.length&&(c[b.name]=b))}var h=b("./vectortilelayer");c.ka=function(b,c){this.layers=
b.Qf(g,{},c)}},{"./vectortilelayer":4}],3:[function(b,c){function g(b,c,e,f,g){this.properties={};this.extent=e;this.type=0;this.pc=b;this.af=-1;this.Rd=f;this.Td=g;b.Qf(h,this,c)}function h(b,c,e){if(1==b)c.Gp=e.Aa();else if(2==b)for(b=e.Aa()+e.ca;e.ca<b;){var f=c.Rd[e.Aa()],g=c.Td[e.Aa()];c.properties[f]=g}else 3==b?c.type=e.Aa():4==b&&(c.af=e.ca)}var k=b("point-geometry");c.ka=g;g.types=["Unknown","Point","LineString","Polygon"];g.prototype.Wg=function(){var b=this.pc;b.ca=this.af;for(var c=b.Aa()+
b.ca,e=1,f=0,g=0,h=0,v=[],x;b.ca<c;)if(f||(f=b.Aa(),e=f&7,f=f>>3),f--,1===e||2===e)g+=b.Id(),h+=b.Id(),1===e&&(x&&v.push(x),x=[]),x.push(new k(g,h));else if(7===e)x&&x.push(x[0].clone());else throw Error("unknown command "+e);x&&v.push(x);return v};g.prototype.bbox=function(){var b=this.pc;b.ca=this.af;for(var c=b.Aa()+b.ca,e=1,f=0,g=0,h=0,k=Infinity,x=-Infinity,C=Infinity,A=-Infinity;b.ca<c;)if(f||(f=b.Aa(),e=f&7,f=f>>3),f--,1===e||2===e)g+=b.Id(),h+=b.Id(),g<k&&(k=g),g>x&&(x=g),h<C&&(C=h),h>A&&
(A=h);else if(7!==e)throw Error("unknown command "+e);return[k,C,x,A]}},{"point-geometry":5}],4:[function(b,c){function g(b,c){this.version=1;this.name=null;this.extent=4096;this.length=0;this.pc=b;this.Rd=[];this.Td=[];this.Qd=[];b.Qf(h,this,c);this.length=this.Qd.length}function h(b,c,e){15===b?c.version=e.Aa():1===b?c.name=e.Vf():5===b?c.extent=e.Aa():2===b?c.Qd.push(e.ca):3===b?c.Rd.push(e.Vf()):4===b&&c.Td.push(k(e))}function k(b){for(var c=null,e=b.Aa()+b.ca;b.ca<e;)c=b.Aa()>>3,c=1===c?b.Vf():
2===c?b.to():3===c?b.po():4===c?b.Eo():5===c?b.Aa():6===c?b.Id():7===c?b.no():null;return c}var m=b("./vectortilefeature.js");c.ka=g;g.prototype.feature=function(b){if(0>b||b>=this.Qd.length)throw Error("feature index out of bounds");this.pc.ca=this.Qd[b];b=this.pc.Aa()+this.pc.ca;return new m(this.pc,b,this.extent,this.Rd,this.Td)}},{"./vectortilefeature.js":3}],5:[function(b,c){function g(b,c){this.x=b;this.y=c}c.ka=g;g.prototype={clone:function(){return new g(this.x,this.y)},rotate:function(b){return this.clone().mj(b)},
round:function(){return this.clone().nj()},angle:function(){return Math.atan2(this.y,this.x)},mj:function(b){var c=Math.cos(b);b=Math.sin(b);var e=b*this.x+c*this.y;this.x=c*this.x-b*this.y;this.y=e;return this},nj:function(){this.x=Math.round(this.x);this.y=Math.round(this.y);return this}};g.a=function(b){return b instanceof g?b:Array.isArray(b)?new g(b[0],b[1]):b}},{}]},{},[1])(1)});Bp=c.ka})();function Rv(b){this.defaultDataProjection=null;b=b?b:{};this.defaultDataProjection=new Be({code:"EPSG:3857",units:"tile-pixels"});this.a=b.featureClass?b.featureClass:Xm;this.c=b.geometryName?b.geometryName:"geometry";this.f=b.layerName?b.layerName:"layer";this.b=b.layers?b.layers:null}z(Rv,Sr);Rv.prototype.V=function(){return"arraybuffer"};
Rv.prototype.Ca=function(b,c){var d=this.b,e=new Ap(b),e=new Bp.bj(e),f=[],g=this.a,h,k,m;for(m in e.layers)if(!d||-1!=d.indexOf(m)){h=e.layers[m];for(var n=0,p=h.length;n<p;++n){if(g===Xm){var q=h.feature(n);k=m;var r=q.Wg(),t=[],v=[];Sv(r,v,t);var x=q.type,C=void 0;1===x?C=1===r.length?"Point":"MultiPoint":2===x?C=1===r.length?"LineString":"MultiLineString":3===x&&(C="Polygon");q=q.properties;q[this.f]=k;k=new this.a(C,v,t,q)}else{q=h.feature(n);C=m;v=c;k=new this.a;t=q.properties;t[this.f]=C;C=
q.type;if(0===C)C=null;else{q=q.Wg();r=[];x=[];Sv(q,x,r);var A=void 0;1===C?A=1===q.length?new F(null):new bs(null):2===C?1===q.length?A=new U(null):A=new V(null):3===C&&(A=new G(null));A.ba("XY",x,r);C=A}(v=Vr(C,!1,Ur(this,v)))&&(t[this.c]=v);k.I(t);k.Cc(this.c)}f.push(k)}}return f};Rv.prototype.Ka=function(){return this.defaultDataProjection};Rv.prototype.g=function(b){this.b=b};
function Sv(b,c,d){for(var e=0,f=0,g=b.length;f<g;++f){var h=b[f],k,m;k=0;for(m=h.length;k<m;++k){var n=h[k];c.push(n.x,n.y)}e+=2*k;d.push(e)}};function Tv(){this.defaultDataProjection=null;this.defaultDataProjection=Ee("EPSG:4326")}z(Tv,vs);function Uv(b,c){c[c.length-1].Kd[b.getAttribute("k")]=b.getAttribute("v")}
var Vv=[null],Wv=Q(Vv,{nd:function(b,c){c[c.length-1].Pc.push(b.getAttribute("ref"))},tag:Uv}),Yv=Q(Vv,{node:function(b,c){var d=c[0],e=c[c.length-1],f=b.getAttribute("id"),g=[parseFloat(b.getAttribute("lon")),parseFloat(b.getAttribute("lat"))];e.Zg[f]=g;var h=S({Kd:{}},Xv,b,c);Nb(h.Kd)||(g=new F(g),Vr(g,!1,d),d=new un(g),d.kc(f),d.I(h.Kd),e.features.push(d))},way:function(b,c){for(var d=c[0],e=b.getAttribute("id"),f=S({Pc:[],Kd:{}},Wv,b,c),g=c[c.length-1],h=[],k=0,m=f.Pc.length;k<m;k++)jb(h,g.Zg[f.Pc[k]]);
f.Pc[0]==f.Pc[f.Pc.length-1]?(k=new G(null),k.ba("XY",h,[h.length])):(k=new U(null),k.ba("XY",h));Vr(k,!1,d);d=new un(k);d.kc(e);d.I(f.Kd);g.features.push(d)}}),Xv=Q(Vv,{tag:Uv});Tv.prototype.jc=function(b,c){var d=Tr(this,b,c);return"osm"==b.localName&&(d=S({Zg:{},features:[]},Yv,b,[d]),d.features)?d.features:[]};function Zv(b){return b.getAttributeNS("http://www.w3.org/1999/xlink","href")};function $v(){}$v.prototype.read=function(b){return Xo(b)?this.f(b):$o(b)?this.a(b):la(b)?(b=jp(b),this.f(b)):null};function aw(){}z(aw,$v);aw.prototype.f=function(b){for(b=b.firstChild;b;b=b.nextSibling)if(1==b.nodeType)return this.a(b);return null};aw.prototype.a=function(b){return(b=S({},bw,b,[]))?b:null};
var cw=[null,"http://www.opengis.net/ows/1.1"],bw=Q(cw,{ServiceIdentification:N(function(b,c){return S({},dw,b,c)}),ServiceProvider:N(function(b,c){return S({},ew,b,c)}),OperationsMetadata:N(function(b,c){return S({},fw,b,c)})}),gw=Q(cw,{DeliveryPoint:N(W),City:N(W),AdministrativeArea:N(W),PostalCode:N(W),Country:N(W),ElectronicMailAddress:N(W)}),hw=Q(cw,{Value:np(function(b){return W(b)})}),iw=Q(cw,{AllowedValues:N(function(b,c){return S({},hw,b,c)})}),kw=Q(cw,{Phone:N(function(b,c){return S({},
jw,b,c)}),Address:N(function(b,c){return S({},gw,b,c)})}),mw=Q(cw,{HTTP:N(function(b,c){return S({},lw,b,c)})}),lw=Q(cw,{Get:np(function(b,c){var d=Zv(b);return d?S({href:d},nw,b,c):void 0}),Post:void 0}),ow=Q(cw,{DCP:N(function(b,c){return S({},mw,b,c)})}),fw=Q(cw,{Operation:function(b,c){var d=b.getAttribute("name"),e=S({},ow,b,c);e&&(c[c.length-1][d]=e)}}),jw=Q(cw,{Voice:N(W),Facsimile:N(W)}),nw=Q(cw,{Constraint:np(function(b,c){var d=b.getAttribute("name");return d?S({name:d},iw,b,c):void 0})}),
pw=Q(cw,{IndividualName:N(W),PositionName:N(W),ContactInfo:N(function(b,c){return S({},kw,b,c)})}),dw=Q(cw,{Title:N(W),ServiceTypeVersion:N(W),ServiceType:N(W)}),ew=Q(cw,{ProviderName:N(W),ProviderSite:N(Zv),ServiceContact:N(function(b,c){return S({},pw,b,c)})});function qw(b,c,d,e){var f;void 0!==e?f=e:f=[];for(var g=e=0;g<c;){var h=b[g++];f[e++]=b[g++];f[e++]=h;for(h=2;h<d;++h)f[e++]=b[g++]}f.length=e};function rw(b){b=b?b:{};this.defaultDataProjection=null;this.defaultDataProjection=Ee("EPSG:4326");this.a=b.factor?b.factor:1E5;this.f=b.geometryLayout?b.geometryLayout:"XY"}z(rw,Dt);function sw(b,c,d){var e,f=Array(c);for(e=0;e<c;++e)f[e]=0;var g,h;g=0;for(h=b.length;g<h;)for(e=0;e<c;++e,++g){var k=b[g],m=k-f[e];f[e]=k;b[g]=m}return tw(b,d?d:1E5)}
function uw(b,c,d){var e,f=Array(c);for(e=0;e<c;++e)f[e]=0;b=vw(b,d?d:1E5);var g;d=0;for(g=b.length;d<g;)for(e=0;e<c;++e,++d)f[e]+=b[d],b[d]=f[e];return b}function tw(b,c){var d=c?c:1E5,e,f;e=0;for(f=b.length;e<f;++e)b[e]=Math.round(b[e]*d);d=0;for(e=b.length;d<e;++d)f=b[d],b[d]=0>f?~(f<<1):f<<1;d="";e=0;for(f=b.length;e<f;++e){for(var g=b[e],h=void 0,k="";32<=g;)h=(32|g&31)+63,k+=String.fromCharCode(h),g>>=5;h=g+63;k+=String.fromCharCode(h);d+=k}return d}
function vw(b,c){var d=c?c:1E5,e=[],f=0,g=0,h,k;h=0;for(k=b.length;h<k;++h){var m=b.charCodeAt(h)-63,f=f|(m&31)<<g;32>m?(e.push(f),g=f=0):g+=5}f=0;for(g=e.length;f<g;++f)h=e[f],e[f]=h&1?~(h>>1):h>>1;f=0;for(g=e.length;f<g;++f)e[f]/=d;return e}l=rw.prototype;l.Fd=function(b,c){var d=this.Hd(b,c);return new un(d)};l.Pf=function(b,c){return[this.Fd(b,c)]};l.Hd=function(b,c){var d=cf(this.f),e=uw(b,d,this.a);qw(e,e.length,d,e);d=qf(e,0,e.length,d);return Vr(new U(d,this.f),!1,Ur(this,c))};
l.Te=function(b,c){var d=b.W();return d?this.Md(d,c):""};l.zi=function(b,c){return this.Te(b[0],c)};l.Md=function(b,c){b=Vr(b,!0,Ur(this,c));var d=b.ja(),e=b.sa();qw(d,d.length,e,d);return sw(d,e,this.a)};function ww(b){b=b?b:{};this.defaultDataProjection=null;this.defaultDataProjection=Ee(b.defaultDataProjection?b.defaultDataProjection:"EPSG:4326")}z(ww,Wr);function xw(b,c){var d=[],e,f,g,h;g=0;for(h=b.length;g<h;++g)e=b[g],0<g&&d.pop(),0<=e?f=c[e]:f=c[~e].slice().reverse(),d.push.apply(d,f);e=0;for(f=d.length;e<f;++e)d[e]=d[e].slice();return d}function yw(b,c,d,e,f){b=b.geometries;var g=[],h,k;h=0;for(k=b.length;h<k;++h)g[h]=zw(b[h],c,d,e,f);return g}
function zw(b,c,d,e,f){var g=b.type,h=Aw[g];c="Point"===g||"MultiPoint"===g?h(b,d,e):h(b,c);d=new un;d.Oa(Vr(c,!1,f));void 0!==b.id&&d.kc(b.id);b.properties&&d.I(b.properties);return d}
ww.prototype.Of=function(b,c){if("Topology"==b.type){var d,e=null,f=null;b.transform&&(d=b.transform,e=d.scale,f=d.translate);var g=b.arcs;if(d){d=e;var h=f,k,m;k=0;for(m=g.length;k<m;++k)for(var n=g[k],p=d,q=h,r=0,t=0,v=void 0,x=void 0,C=void 0,x=0,C=n.length;x<C;++x)v=n[x],r+=v[0],t+=v[1],v[0]=r,v[1]=t,Bw(v,p,q)}d=[];h=Kb(b.objects);k=0;for(m=h.length;k<m;++k)"GeometryCollection"===h[k].type?(n=h[k],d.push.apply(d,yw(n,g,e,f,c))):(n=h[k],d.push(zw(n,g,e,f,c)));return d}return[]};
function Bw(b,c,d){b[0]=b[0]*c[0]+d[0];b[1]=b[1]*c[1]+d[1]}ww.prototype.Ka=function(){return this.defaultDataProjection};
var Aw={Point:function(b,c,d){b=b.coordinates;c&&d&&Bw(b,c,d);return new F(b)},LineString:function(b,c){var d=xw(b.arcs,c);return new U(d)},Polygon:function(b,c){var d=[],e,f;e=0;for(f=b.arcs.length;e<f;++e)d[e]=xw(b.arcs[e],c);return new G(d)},MultiPoint:function(b,c,d){b=b.coordinates;var e,f;if(c&&d)for(e=0,f=b.length;e<f;++e)Bw(b[e],c,d);return new bs(b)},MultiLineString:function(b,c){var d=[],e,f;e=0;for(f=b.arcs.length;e<f;++e)d[e]=xw(b.arcs[e],c);return new V(d)},MultiPolygon:function(b,c){var d=
[],e,f,g,h,k,m;k=0;for(m=b.arcs.length;k<m;++k){e=b.arcs[k];f=[];g=0;for(h=e.length;g<h;++g)f[g]=xw(e[g],c);d[k]=f}return new cs(d)}};function Cw(b){b=b?b:{};this.g=b.featureType;this.b=b.featureNS;this.a=b.gmlFormat?b.gmlFormat:new Ls;this.c=b.schemaLocation?b.schemaLocation:"http://www.opengis.net/wfs http://schemas.opengis.net/wfs/1.1.0/wfs.xsd";this.defaultDataProjection=null}z(Cw,vs);Cw.prototype.jc=function(b,c){var d={featureType:this.g,featureNS:this.b};Ub(d,Tr(this,b,c?c:{}));d=[d];this.a.a["http://www.opengis.net/gml"].featureMember=lp(ys.prototype.Gd);(d=S([],this.a.a,b,d,this.a))||(d=[]);return d};
Cw.prototype.j=function(b){if(Xo(b))return Dw(b);if($o(b))return S({},Ew,b,[]);if(la(b))return b=jp(b),Dw(b)};Cw.prototype.i=function(b){if(Xo(b))return Fw(this,b);if($o(b))return Gw(this,b);if(la(b))return b=jp(b),Fw(this,b)};function Fw(b,c){for(var d=c.firstChild;d;d=d.nextSibling)if(1==d.nodeType)return Gw(b,d)}var Hw={"http://www.opengis.net/gml":{boundedBy:N(ys.prototype.Le,"bounds")}};
function Gw(b,c){var d={},e=Fs(c.getAttribute("numberOfFeatures"));d.numberOfFeatures=e;return S(d,Hw,c,[],b.a)}
var Iw={"http://www.opengis.net/wfs":{totalInserted:N(Es),totalUpdated:N(Es),totalDeleted:N(Es)}},Jw={"http://www.opengis.net/ogc":{FeatureId:lp(function(b){return b.getAttribute("fid")})}},Kw={"http://www.opengis.net/wfs":{Feature:function(b,c){tp(Jw,b,c)}}},Ew={"http://www.opengis.net/wfs":{TransactionSummary:N(function(b,c){return S({},Iw,b,c)},"transactionSummary"),InsertResults:N(function(b,c){return S([],Kw,b,c)},"insertIds")}};
function Dw(b){for(b=b.firstChild;b;b=b.nextSibling)if(1==b.nodeType)return S({},Ew,b,[])}var Lw={"http://www.opengis.net/wfs":{PropertyName:O(Hs)}};function Mw(b,c){var d=Po("http://www.opengis.net/ogc","Filter"),e=Po("http://www.opengis.net/ogc","FeatureId");d.appendChild(e);e.setAttribute("fid",c);b.appendChild(d)}
var Nw={"http://www.opengis.net/wfs":{Insert:O(function(b,c,d){var e=d[d.length-1],e=Po(e.featureNS,e.featureType);b.appendChild(e);Ls.prototype.yi(e,c,d)}),Update:O(function(b,c,d){var e=d[d.length-1],f=e.featureType,g=e.featurePrefix,g=g?g:"feature",h=e.featureNS;b.setAttribute("typeName",g+":"+f);ip(b,"http://www.w3.org/2000/xmlns/","xmlns:"+g,h);if(f=c.Qa()){for(var g=c.P(),h=[],k=0,m=g.length;k<m;k++){var n=c.get(g[k]);void 0!==n&&h.push({name:g[k],value:n})}up({node:b,srsName:e.srsName},Nw,
pp("Property"),h,d);Mw(b,f)}}),Delete:O(function(b,c,d){var e=d[d.length-1];d=e.featureType;var f=e.featurePrefix,f=f?f:"feature",e=e.featureNS;b.setAttribute("typeName",f+":"+d);ip(b,"http://www.w3.org/2000/xmlns/","xmlns:"+f,e);(c=c.Qa())&&Mw(b,c)}),Property:O(function(b,c,d){var e=Po("http://www.opengis.net/wfs","Name");b.appendChild(e);Hs(e,c.name);void 0!==c.value&&null!==c.value&&(e=Po("http://www.opengis.net/wfs","Value"),b.appendChild(e),c.value instanceof $e?Ls.prototype.Ve(e,c.value,d):
Hs(e,c.value))}),Native:O(function(b,c){c.mp&&b.setAttribute("vendorId",c.mp);void 0!==c.Qo&&b.setAttribute("safeToIgnore",c.Qo);void 0!==c.value&&Hs(b,c.value)})}},Ow={"http://www.opengis.net/wfs":{Query:O(function(b,c,d){var e=d[d.length-1],f=e.featurePrefix,g=e.featureNS,h=e.propertyNames,k=e.srsName;b.setAttribute("typeName",(f?f+":":"")+c);k&&b.setAttribute("srsName",k);g&&ip(b,"http://www.w3.org/2000/xmlns/","xmlns:"+f,g);c=Rb(e);c.node=b;up(c,Lw,pp("PropertyName"),h,d);if(e=e.bbox)h=Po("http://www.opengis.net/ogc",
"Filter"),c=d[d.length-1].geometryName,f=Po("http://www.opengis.net/ogc","BBOX"),h.appendChild(f),g=Po("http://www.opengis.net/ogc","PropertyName"),Hs(g,c),f.appendChild(g),Ls.prototype.Ve(f,e,d),b.appendChild(h)})}};
Cw.prototype.l=function(b){var c=Po("http://www.opengis.net/wfs","GetFeature");c.setAttribute("service","WFS");c.setAttribute("version","1.1.0");b&&(b.handle&&c.setAttribute("handle",b.handle),b.outputFormat&&c.setAttribute("outputFormat",b.outputFormat),void 0!==b.maxFeatures&&c.setAttribute("maxFeatures",b.maxFeatures),b.resultType&&c.setAttribute("resultType",b.resultType),void 0!==b.startIndex&&c.setAttribute("startIndex",b.startIndex),void 0!==b.count&&c.setAttribute("count",b.count));ip(c,"http://www.w3.org/2001/XMLSchema-instance",
"xsi:schemaLocation",this.c);var d=b.featureTypes;b=[{node:c,srsName:b.srsName,featureNS:b.featureNS?b.featureNS:this.b,featurePrefix:b.featurePrefix,geometryName:b.geometryName,bbox:b.bbox,propertyNames:b.propertyNames?b.propertyNames:[]}];var e=Rb(b[b.length-1]);e.node=c;up(e,Ow,pp("Query"),d,b);return c};
Cw.prototype.B=function(b,c,d,e){var f=[],g=Po("http://www.opengis.net/wfs","Transaction");g.setAttribute("service","WFS");g.setAttribute("version","1.1.0");var h,k;e&&(h=e.gmlOptions?e.gmlOptions:{},e.handle&&g.setAttribute("handle",e.handle));ip(g,"http://www.w3.org/2001/XMLSchema-instance","xsi:schemaLocation",this.c);b&&(k={node:g,featureNS:e.featureNS,featureType:e.featureType,featurePrefix:e.featurePrefix},Ub(k,h),up(k,Nw,pp("Insert"),b,f));c&&(k={node:g,featureNS:e.featureNS,featureType:e.featureType,
featurePrefix:e.featurePrefix},Ub(k,h),up(k,Nw,pp("Update"),c,f));d&&up({node:g,featureNS:e.featureNS,featureType:e.featureType,featurePrefix:e.featurePrefix},Nw,pp("Delete"),d,f);e.nativeElements&&up({node:g,featureNS:e.featureNS,featureType:e.featureType,featurePrefix:e.featurePrefix},Nw,pp("Native"),e.nativeElements,f);return g};Cw.prototype.Uf=function(b){for(b=b.firstChild;b;b=b.nextSibling)if(1==b.nodeType)return this.Oe(b);return null};
Cw.prototype.Oe=function(b){if(b.firstElementChild&&b.firstElementChild.firstElementChild)for(b=b.firstElementChild.firstElementChild,b=b.firstElementChild;b;b=b.nextElementSibling)if(0!==b.childNodes.length&&(1!==b.childNodes.length||3!==b.firstChild.nodeType)){var c=[{}];this.a.Le(b,c);return Ee(c.pop().srsName)}return null};function Pw(b){b=b?b:{};this.defaultDataProjection=null;this.a=void 0!==b.splitCollection?b.splitCollection:!1}z(Pw,Dt);function Qw(b){b=b.Z();return 0===b.length?"":b[0]+" "+b[1]}function Rw(b){b=b.Z();for(var c=[],d=0,e=b.length;d<e;++d)c.push(b[d][0]+" "+b[d][1]);return c.join(",")}function Sw(b){var c=[];b=b.de();for(var d=0,e=b.length;d<e;++d)c.push("("+Rw(b[d])+")");return c.join(",")}function Tw(b){var c=b.V();b=(0,Uw[c])(b);c=c.toUpperCase();return 0===b.length?c+" EMPTY":c+"("+b+")"}
var Uw={Point:Qw,LineString:Rw,Polygon:Sw,MultiPoint:function(b){var c=[];b=b.xe();for(var d=0,e=b.length;d<e;++d)c.push("("+Qw(b[d])+")");return c.join(",")},MultiLineString:function(b){var c=[];b=b.ud();for(var d=0,e=b.length;d<e;++d)c.push("("+Rw(b[d])+")");return c.join(",")},MultiPolygon:function(b){var c=[];b=b.ee();for(var d=0,e=b.length;d<e;++d)c.push("("+Sw(b[d])+")");return c.join(",")},GeometryCollection:function(b){var c=[];b=b.Fg();for(var d=0,e=b.length;d<e;++d)c.push(Tw(b[d]));return c.join(",")}};
l=Pw.prototype;l.Fd=function(b,c){var d=this.Hd(b,c);if(d){var e=new un;e.Oa(d);return e}return null};l.Pf=function(b,c){var d=[],e=this.Hd(b,c);this.a&&"GeometryCollection"==e.V()?d=e.c:d=[e];for(var f=[],g=0,h=d.length;g<h;++g)e=new un,e.Oa(d[g]),f.push(e);return f};l.Hd=function(b,c){var d;d=new Vw(new Ww(b));d.a=Xw(d.f);return(d=Yw(d))?Vr(d,!1,c):null};l.Te=function(b,c){var d=b.W();return d?this.Md(d,c):""};
l.zi=function(b,c){if(1==b.length)return this.Te(b[0],c);for(var d=[],e=0,f=b.length;e<f;++e)d.push(b[e].W());d=new ms(d);return this.Md(d,c)};l.Md=function(b,c){return Tw(Vr(b,!0,c))};function Ww(b){this.f=b;this.a=-1}function Zw(b,c){return"0"<=b&&"9">=b||"."==b&&!(void 0!==c&&c)}
function Xw(b){var c=b.f.charAt(++b.a),d={position:b.a,value:c};if("("==c)d.type=2;else if(","==c)d.type=5;else if(")"==c)d.type=3;else if(Zw(c)||"-"==c){d.type=4;var e,c=b.a,f=!1,g=!1;do{if("."==e)f=!0;else if("e"==e||"E"==e)g=!0;e=b.f.charAt(++b.a)}while(Zw(e,f)||!g&&("e"==e||"E"==e)||g&&("-"==e||"+"==e));b=parseFloat(b.f.substring(c,b.a--));d.value=b}else if("a"<=c&&"z">=c||"A"<=c&&"Z">=c){d.type=1;c=b.a;do e=b.f.charAt(++b.a);while("a"<=e&&"z">=e||"A"<=e&&"Z">=e);b=b.f.substring(c,b.a--).toUpperCase();
d.value=b}else{if(" "==c||"\t"==c||"\r"==c||"\n"==c)return Xw(b);if(""===c)d.type=6;else throw Error("Unexpected character: "+c);}return d}function Vw(b){this.f=b}l=Vw.prototype;l.match=function(b){if(b=this.a.type==b)this.a=Xw(this.f);return b};
function Yw(b){var c=b.a;if(b.match(1)){var d=c.value;if("GEOMETRYCOLLECTION"==d){a:{if(b.match(2)){c=[];do c.push(Yw(b));while(b.match(5));if(b.match(3)){b=c;break a}}else if($w(b)){b=[];break a}throw Error(ax(b));}return new ms(b)}var e=bx[d],c=cx[d];if(!e||!c)throw Error("Invalid geometry type: "+d);b=e.call(b);return new c(b)}throw Error(ax(b));}l.Jf=function(){if(this.match(2)){var b=dx(this);if(this.match(3))return b}else if($w(this))return null;throw Error(ax(this));};
l.If=function(){if(this.match(2)){var b=ex(this);if(this.match(3))return b}else if($w(this))return[];throw Error(ax(this));};l.Kf=function(){if(this.match(2)){var b=fx(this);if(this.match(3))return b}else if($w(this))return[];throw Error(ax(this));};l.$n=function(){if(this.match(2)){var b;if(2==this.a.type)for(b=[this.Jf()];this.match(5);)b.push(this.Jf());else b=ex(this);if(this.match(3))return b}else if($w(this))return[];throw Error(ax(this));};
l.Zn=function(){if(this.match(2)){var b=fx(this);if(this.match(3))return b}else if($w(this))return[];throw Error(ax(this));};l.ao=function(){if(this.match(2)){for(var b=[this.Kf()];this.match(5);)b.push(this.Kf());if(this.match(3))return b}else if($w(this))return[];throw Error(ax(this));};function dx(b){for(var c=[],d=0;2>d;++d){var e=b.a;if(b.match(4))c.push(e.value);else break}if(2==c.length)return c;throw Error(ax(b));}function ex(b){for(var c=[dx(b)];b.match(5);)c.push(dx(b));return c}
function fx(b){for(var c=[b.If()];b.match(5);)c.push(b.If());return c}function $w(b){var c=1==b.a.type&&"EMPTY"==b.a.value;c&&(b.a=Xw(b.f));return c}function ax(b){return"Unexpected `"+b.a.value+"` at position "+b.a.position+" in `"+b.f.f+"`"}var cx={POINT:F,LINESTRING:U,POLYGON:G,MULTIPOINT:bs,MULTILINESTRING:V,MULTIPOLYGON:cs},bx={POINT:Vw.prototype.Jf,LINESTRING:Vw.prototype.If,POLYGON:Vw.prototype.Kf,MULTIPOINT:Vw.prototype.$n,MULTILINESTRING:Vw.prototype.Zn,MULTIPOLYGON:Vw.prototype.ao};function gx(){this.version=void 0}z(gx,$v);gx.prototype.f=function(b){for(b=b.firstChild;b;b=b.nextSibling)if(1==b.nodeType)return this.a(b);return null};gx.prototype.a=function(b){this.version=b.getAttribute("version").trim();return(b=S({version:this.version},hx,b,[]))?b:null};function ix(b,c){return S({},jx,b,c)}function kx(b,c){return S({},lx,b,c)}function mx(b,c){var d=ix(b,c);if(d){var e=[Fs(b.getAttribute("width")),Fs(b.getAttribute("height"))];d.size=e;return d}}
function nx(b,c){return S([],ox,b,c)}
var px=[null,"http://www.opengis.net/wms"],hx=Q(px,{Service:N(function(b,c){return S({},qx,b,c)}),Capability:N(function(b,c){return S({},rx,b,c)})}),rx=Q(px,{Request:N(function(b,c){return S({},sx,b,c)}),Exception:N(function(b,c){return S([],tx,b,c)}),Layer:N(function(b,c){return S({},ux,b,c)})}),qx=Q(px,{Name:N(W),Title:N(W),Abstract:N(W),KeywordList:N(nx),OnlineResource:N(Zv),ContactInformation:N(function(b,c){return S({},vx,b,c)}),Fees:N(W),AccessConstraints:N(W),LayerLimit:N(Es),MaxWidth:N(Es),
MaxHeight:N(Es)}),vx=Q(px,{ContactPersonPrimary:N(function(b,c){return S({},wx,b,c)}),ContactPosition:N(W),ContactAddress:N(function(b,c){return S({},xx,b,c)}),ContactVoiceTelephone:N(W),ContactFacsimileTelephone:N(W),ContactElectronicMailAddress:N(W)}),wx=Q(px,{ContactPerson:N(W),ContactOrganization:N(W)}),xx=Q(px,{AddressType:N(W),Address:N(W),City:N(W),StateOrProvince:N(W),PostCode:N(W),Country:N(W)}),tx=Q(px,{Format:lp(W)}),ux=Q(px,{Name:N(W),Title:N(W),Abstract:N(W),KeywordList:N(nx),CRS:np(W),
EX_GeographicBoundingBox:N(function(b,c){var d=S({},yx,b,c);if(d){var e=d.westBoundLongitude,f=d.southBoundLatitude,g=d.eastBoundLongitude,d=d.northBoundLatitude;return void 0===e||void 0===f||void 0===g||void 0===d?void 0:[e,f,g,d]}}),BoundingBox:np(function(b){var c=[Ds(b.getAttribute("minx")),Ds(b.getAttribute("miny")),Ds(b.getAttribute("maxx")),Ds(b.getAttribute("maxy"))],d=[Ds(b.getAttribute("resx")),Ds(b.getAttribute("resy"))];return{crs:b.getAttribute("CRS"),extent:c,res:d}}),Dimension:np(function(b){return{name:b.getAttribute("name"),
units:b.getAttribute("units"),unitSymbol:b.getAttribute("unitSymbol"),"default":b.getAttribute("default"),multipleValues:As(b.getAttribute("multipleValues")),nearestValue:As(b.getAttribute("nearestValue")),current:As(b.getAttribute("current")),values:W(b)}}),Attribution:N(function(b,c){return S({},zx,b,c)}),AuthorityURL:np(function(b,c){var d=ix(b,c);if(d)return d.name=b.getAttribute("name"),d}),Identifier:np(W),MetadataURL:np(function(b,c){var d=ix(b,c);if(d)return d.type=b.getAttribute("type"),
d}),DataURL:np(ix),FeatureListURL:np(ix),Style:np(function(b,c){return S({},Ax,b,c)}),MinScaleDenominator:N(Cs),MaxScaleDenominator:N(Cs),Layer:np(function(b,c){var d=c[c.length-1],e=S({},ux,b,c);if(e){var f=As(b.getAttribute("queryable"));void 0===f&&(f=d.queryable);e.queryable=void 0!==f?f:!1;f=Fs(b.getAttribute("cascaded"));void 0===f&&(f=d.cascaded);e.cascaded=f;f=As(b.getAttribute("opaque"));void 0===f&&(f=d.opaque);e.opaque=void 0!==f?f:!1;f=As(b.getAttribute("noSubsets"));void 0===f&&(f=d.noSubsets);
e.noSubsets=void 0!==f?f:!1;(f=Ds(b.getAttribute("fixedWidth")))||(f=d.fixedWidth);e.fixedWidth=f;(f=Ds(b.getAttribute("fixedHeight")))||(f=d.fixedHeight);e.fixedHeight=f;["Style","CRS","AuthorityURL"].forEach(function(b){if(b in d){var c=Qb(e,b),c=c.concat(d[b]);e[b]=c}});"EX_GeographicBoundingBox BoundingBox Dimension Attribution MinScaleDenominator MaxScaleDenominator".split(" ").forEach(function(b){b in e||(e[b]=d[b])});return e}})}),zx=Q(px,{Title:N(W),OnlineResource:N(Zv),LogoURL:N(mx)}),yx=
Q(px,{westBoundLongitude:N(Cs),eastBoundLongitude:N(Cs),southBoundLatitude:N(Cs),northBoundLatitude:N(Cs)}),sx=Q(px,{GetCapabilities:N(kx),GetMap:N(kx),GetFeatureInfo:N(kx)}),lx=Q(px,{Format:np(W),DCPType:np(function(b,c){return S({},Bx,b,c)})}),Bx=Q(px,{HTTP:N(function(b,c){return S({},Cx,b,c)})}),Cx=Q(px,{Get:N(ix),Post:N(ix)}),Ax=Q(px,{Name:N(W),Title:N(W),Abstract:N(W),LegendURL:np(mx),StyleSheetURL:N(ix),StyleURL:N(ix)}),jx=Q(px,{Format:N(W),OnlineResource:N(Zv)}),ox=Q(px,{Keyword:lp(W)});function Dx(){this.b="http://mapserver.gis.umn.edu/mapserver";this.a=new Ks;this.defaultDataProjection=null}z(Dx,vs);
Dx.prototype.jc=function(b,c){var d={featureType:this.featureType,featureNS:this.featureNS};c&&Ub(d,Tr(this,b,c));var e=[d];b.namespaceURI=this.b;var f=Uo(b),d=[];if(0!==b.childNodes.length){if("msGMLOutput"==f)for(var g=0,h=b.childNodes.length;g<h;g++){var k=b.childNodes[g];if(1===k.nodeType){var m=e[0],n=k.localName.replace("_layer","")+"_feature";m.featureType=n;m.featureNS=this.b;var p={};p[n]=lp(this.a.Nf,this.a);m=Q([m.featureNS,null],p);k.namespaceURI=this.b;(k=S([],m,k,e,this.a))&&jb(d,k)}}"FeatureCollection"==
f&&(e=S([],this.a.a,b,[{}],this.a))&&(d=e)}return d};function Ex(){this.b=new aw}z(Ex,$v);Ex.prototype.f=function(b){for(b=b.firstChild;b;b=b.nextSibling)if(1==b.nodeType)return this.a(b);return null};Ex.prototype.a=function(b){this.version=b.getAttribute("version").trim();var c=this.b.a(b);if(!c)return null;c.version=this.version;return(c=S(c,Fx,b,[]))?c:null};function Gx(b){var c=W(b).split(" ");if(c&&2==c.length)return b=+c[0],c=+c[1],isNaN(b)||isNaN(c)?void 0:[b,c]}
var Hx=[null,"http://www.opengis.net/wmts/1.0"],Ix=[null,"http://www.opengis.net/ows/1.1"],Fx=Q(Hx,{Contents:N(function(b,c){return S({},Jx,b,c)})}),Jx=Q(Hx,{Layer:np(function(b,c){return S({},Kx,b,c)}),TileMatrixSet:np(function(b,c){return S({},Lx,b,c)})}),Kx=Q(Hx,{Style:np(function(b,c){var d=S({},Mx,b,c);if(d){var e="true"===b.getAttribute("isDefault");d.isDefault=e;return d}}),Format:np(W),TileMatrixSetLink:np(function(b,c){return S({},Nx,b,c)}),Dimension:np(function(b,c){return S({},Ox,b,c)}),
ResourceURL:np(function(b){var c=b.getAttribute("format"),d=b.getAttribute("template");b=b.getAttribute("resourceType");var e={};c&&(e.format=c);d&&(e.template=d);b&&(e.resourceType=b);return e})},Q(Ix,{Title:N(W),Abstract:N(W),WGS84BoundingBox:N(function(b,c){var d=S([],Px,b,c);return 2!=d.length?void 0:Kd(d)}),Identifier:N(W)})),Mx=Q(Hx,{LegendURL:np(function(b){var c={};c.format=b.getAttribute("format");c.href=Zv(b);return c})},Q(Ix,{Title:N(W),Identifier:N(W)})),Nx=Q(Hx,{TileMatrixSet:N(W)}),
Ox=Q(Hx,{Default:N(W),Value:np(W)},Q(Ix,{Identifier:N(W)})),Px=Q(Ix,{LowerCorner:lp(Gx),UpperCorner:lp(Gx)}),Lx=Q(Hx,{WellKnownScaleSet:N(W),TileMatrix:np(function(b,c){return S({},Qx,b,c)})},Q(Ix,{SupportedCRS:N(W),Identifier:N(W)})),Qx=Q(Hx,{TopLeftCorner:N(Gx),ScaleDenominator:N(Cs),TileWidth:N(Es),TileHeight:N(Es),MatrixWidth:N(Es),MatrixHeight:N(Es)},Q(Ix,{Identifier:N(W)}));function Rx(b){fd.call(this);b=b||{};this.a=null;this.c=Xe;this.b=void 0;D(this,hd("projection"),this.Ll,!1,this);D(this,hd("tracking"),this.Ml,!1,this);void 0!==b.projection&&this.dh(Ee(b.projection));void 0!==b.trackingOptions&&this.oi(b.trackingOptions);this.te(void 0!==b.tracking?b.tracking:!1)}z(Rx,fd);l=Rx.prototype;l.X=function(){this.te(!1);Rx.da.X.call(this)};l.Ll=function(){var b=this.ah();b&&(this.c=Ie(Ee("EPSG:4326"),b),this.a&&this.set("position",this.c(this.a)))};
l.Ml=function(){if(Yi){var b=this.bh();b&&void 0===this.b?this.b=ba.navigator.geolocation.watchPosition(this.jo.bind(this),this.ko.bind(this),this.Mg()):b||void 0===this.b||(ba.navigator.geolocation.clearWatch(this.b),this.b=void 0)}};
l.jo=function(b){b=b.coords;this.set("accuracy",b.accuracy);this.set("altitude",null===b.altitude?void 0:b.altitude);this.set("altitudeAccuracy",null===b.altitudeAccuracy?void 0:b.altitudeAccuracy);this.set("heading",null===b.heading?void 0:Wa(b.heading));this.a?(this.a[0]=b.longitude,this.a[1]=b.latitude):this.a=[b.longitude,b.latitude];var c=this.c(this.a);this.set("position",c);this.set("speed",null===b.speed?void 0:b.speed);b=Jf(Ml,this.a,b.accuracy);b.qc(this.c);this.set("accuracyGeometry",b);
this.u()};l.ko=function(b){b.type="error";this.te(!1);this.s(b)};l.Jj=function(){return this.get("accuracy")};l.Kj=function(){return this.get("accuracyGeometry")||null};l.Mj=function(){return this.get("altitude")};l.Nj=function(){return this.get("altitudeAccuracy")};l.Jl=function(){return this.get("heading")};l.Kl=function(){return this.get("position")};l.ah=function(){return this.get("projection")};l.sk=function(){return this.get("speed")};l.bh=function(){return this.get("tracking")};l.Mg=function(){return this.get("trackingOptions")};
l.dh=function(b){this.set("projection",b)};l.te=function(b){this.set("tracking",b)};l.oi=function(b){this.set("trackingOptions",b)};function Sx(b,c,d){bf.call(this);this.Yf(b,c?c:0,d)}z(Sx,bf);l=Sx.prototype;l.clone=function(){var b=new Sx(null),c=this.A.slice();df(b,this.b,c);b.u();return b};l.pb=function(b,c,d,e){var f=this.A;b-=f[0];var g=c-f[1];c=b*b+g*g;if(c<e){if(0===c)for(e=0;e<this.a;++e)d[e]=f[e];else for(e=this.Df()/Math.sqrt(c),d[0]=f[0]+e*b,d[1]=f[1]+e*g,e=2;e<this.a;++e)d[e]=f[e];d.length=this.a;return c}return e};l.yc=function(b,c){var d=this.A,e=b-d[0],d=c-d[1];return e*e+d*d<=Tx(this)};
l.yd=function(){return this.A.slice(0,this.a)};l.Xd=function(b){var c=this.A,d=c[this.a]-c[0];return Od(c[0]-d,c[1]-d,c[0]+d,c[1]+d,b)};l.Df=function(){return Math.sqrt(Tx(this))};function Tx(b){var c=b.A[b.a]-b.A[0];b=b.A[b.a+1]-b.A[1];return c*c+b*b}l.V=function(){return"Circle"};l.Fa=function(b){var c=this.J();return ne(b,c)?(c=this.yd(),b[0]<=c[0]&&b[2]>=c[0]||b[1]<=c[1]&&b[3]>=c[1]?!0:be(b,this.sg,this)):!1};
l.fm=function(b){var c=this.a,d=this.A[c]-this.A[0],e=b.slice();e[c]=e[0]+d;for(d=1;d<c;++d)e[c+d]=b[d];df(this,this.b,e);this.u()};l.Yf=function(b,c,d){if(b){ef(this,d,b,0);this.A||(this.A=[]);d=this.A;b=nf(d,b);d[b++]=d[0]+c;var e;c=1;for(e=this.a;c<e;++c)d[b++]=d[c];d.length=b}else df(this,"XY",null);this.u()};l.gm=function(b){this.A[this.a]=this.A[0]+b;this.u()};function Ux(b,c,d){for(var e=[],f=b(0),g=b(1),h=c(f),k=c(g),m=[g,f],n=[k,h],p=[1,0],q={},r=1E5,t,v,x,C,A;0<--r&&0<p.length;)x=p.pop(),f=m.pop(),h=n.pop(),g=x.toString(),g in q||(e.push(h[0],h[1]),q[g]=!0),C=p.pop(),g=m.pop(),k=n.pop(),A=(x+C)/2,t=b(A),v=c(t),Ua(v[0],v[1],h[0],h[1],k[0],k[1])<d?(e.push(k[0],k[1]),g=C.toString(),q[g]=!0):(p.push(C,A,A,x),n.push(k,v,v,h),m.push(g,t,t,f));return e}function Vx(b,c,d,e,f){var g=Ee("EPSG:4326");return Ux(function(e){return[b,c+(d-c)*e]},We(g,e),f)}
function Wx(b,c,d,e,f){var g=Ee("EPSG:4326");return Ux(function(e){return[c+(d-c)*e,b]},We(g,e),f)};function Xx(b){b=b||{};this.g=this.l=null;this.b=this.i=Infinity;this.c=this.j=-Infinity;this.C=this.v=Infinity;this.O=this.D=-Infinity;this.U=void 0!==b.targetSize?b.targetSize:100;this.pa=void 0!==b.maxLines?b.maxLines:100;this.a=[];this.f=[];this.wa=void 0!==b.strokeStyle?b.strokeStyle:Yx;this.B=this.o=void 0;this.G=null;this.setMap(void 0!==b.map?b.map:null)}var Yx=new am({color:"rgba(0,0,0,0.2)"}),Zx=[90,45,30,20,10,5,2,1,.5,.2,.1,.05,.01,.005,.002,.001];
function $x(b,c,d,e,f,g,h){var k=h;c=Vx(c,d,e,b.g,f);k=void 0!==b.a[k]?b.a[k]:new U(null);k.ba("XY",c);ne(k.J(),g)&&(b.a[h++]=k);return h}function ay(b,c,d,e,f){var g=f;c=Wx(c,b.c,b.b,b.g,d);g=void 0!==b.f[g]?b.f[g]:new U(null);g.ba("XY",c);ne(g.J(),e)&&(b.f[f++]=g);return f}l=Xx.prototype;l.Nl=function(){return this.l};l.ek=function(){return this.a};l.lk=function(){return this.f};
l.Rg=function(b){var c=b.vectorContext,d=b.frameState,e=d.extent;b=d.viewState;var f=b.center,g=b.projection,h=b.resolution;b=d.pixelRatio;b=h*h/(4*b*b);if(!this.g||!Ve(this.g,g)){var k=Ee("EPSG:4326"),m=g.J(),n=g.i,p=Ze(n,k,g),q=n[2],r=n[1],t=n[0],v=p[3],x=p[2],C=p[1],p=p[0];this.i=n[3];this.b=q;this.j=r;this.c=t;this.v=v;this.C=x;this.D=C;this.O=p;this.o=We(k,g);this.B=We(g,k);this.G=this.B(ke(m));this.g=g}k=0;g.f&&(g=g.J(),k=ie(g),d=d.focus[0],d<g[0]||d>g[2])&&(k*=Math.ceil((g[0]-d)/k),e=[e[0]+
k,e[1],e[2]+k,e[3]]);d=this.G[0];g=this.G[1];k=-1;n=Math.pow(this.U*h,2);q=[];r=[];h=0;for(m=Zx.length;h<m;++h){t=Zx[h]/2;q[0]=d-t;q[1]=g-t;r[0]=d+t;r[1]=g+t;this.o(q,q);this.o(r,r);t=Math.pow(r[0]-q[0],2)+Math.pow(r[1]-q[1],2);if(t<=n)break;k=Zx[h]}h=k;if(-1==h)this.a.length=this.f.length=0;else{d=this.B(f);f=d[0];d=d[1];g=this.pa;k=[Math.max(e[0],this.O),Math.max(e[1],this.D),Math.min(e[2],this.C),Math.min(e[3],this.v)];k=Ze(k,this.g,"EPSG:4326");n=k[3];r=k[1];f=Math.floor(f/h)*h;q=Ra(f,this.c,
this.b);m=$x(this,q,r,n,b,e,0);for(k=0;q!=this.c&&k++<g;)q=Math.max(q-h,this.c),m=$x(this,q,r,n,b,e,m);q=Ra(f,this.c,this.b);for(k=0;q!=this.b&&k++<g;)q=Math.min(q+h,this.b),m=$x(this,q,r,n,b,e,m);this.a.length=m;d=Math.floor(d/h)*h;f=Ra(d,this.j,this.i);m=ay(this,f,b,e,0);for(k=0;f!=this.j&&k++<g;)f=Math.max(f-h,this.j),m=ay(this,f,b,e,m);f=Ra(d,this.j,this.i);for(k=0;f!=this.i&&k++<g;)f=Math.min(f+h,this.i),m=ay(this,f,b,e,m);this.f.length=m}c.eb(null,this.wa);b=0;for(f=this.a.length;b<f;++b)h=
this.a[b],c.Xb(h,null);b=0;for(f=this.f.length;b<f;++b)h=this.f[b],c.Xb(h,null)};l.setMap=function(b){this.l&&(this.l.K("postcompose",this.Rg,this),this.l.render());b&&(b.H("postcompose",this.Rg,this),b.render());this.l=b};function by(b,c,d,e,f,g,h){dk.call(this,b,c,d,0,e);this.l=f;this.f=new Image;null!==g&&(this.f.crossOrigin=g);this.g={};this.c=null;this.state=0;this.j=h}z(by,dk);by.prototype.a=function(b){if(void 0!==b){var c;b=w(b);if(b in this.g)return this.g[b];Nb(this.g)?c=this.f:c=this.f.cloneNode(!1);return this.g[b]=c}return this.f};by.prototype.o=function(){this.state=3;this.c.forEach(Wc);this.c=null;ek(this)};
by.prototype.G=function(){void 0===this.resolution&&(this.resolution=je(this.extent)/this.f.height);this.state=2;this.c.forEach(Wc);this.c=null;ek(this)};by.prototype.load=function(){0==this.state&&(this.state=1,ek(this),this.c=[Uc(this.f,"error",this.o,!1,this),Uc(this.f,"load",this.G,!1,this)],this.j(this,this.l))};function cy(b,c,d,e,f){sh.call(this,b,c);this.j=d;this.f=new Image;null!==e&&(this.f.crossOrigin=e);this.b={};this.i=null;this.l=f}z(cy,sh);l=cy.prototype;l.X=function(){1==this.state&&dy(this);this.a&&qc(this.a);cy.da.X.call(this)};l.Ua=function(b){if(void 0!==b){var c=w(b);if(c in this.b)return this.b[c];b=Nb(this.b)?this.f:this.f.cloneNode(!1);return this.b[c]=b}return this.f};l.bb=function(){return this.j};l.Ol=function(){this.state=3;dy(this);th(this)};
l.Pl=function(){this.state=this.f.naturalWidth&&this.f.naturalHeight?2:4;dy(this);th(this)};l.load=function(){0==this.state&&(this.state=1,th(this),this.i=[Uc(this.f,"error",this.Ol,!1,this),Uc(this.f,"load",this.Pl,!1,this)],this.l(this,this.j))};function dy(b){b.i.forEach(Wc);b.i=null};function ey(b,c){$c.call(this);this.a=new Br(this);var d=b;c&&(d=Ag(b));this.a.Sa(d,"dragenter",this.Rn);d!=b&&this.a.Sa(d,"dragover",this.Sn);this.a.Sa(b,"dragover",this.Tn);this.a.Sa(b,"drop",this.Un)}z(ey,$c);l=ey.prototype;l.od=!1;l.X=function(){ey.da.X.call(this);this.a.rc()};l.Rn=function(b){var c=b.a.dataTransfer;(this.od=!(!c||!(c.types&&(0<=$a(c.types,"Files")||0<=$a(c.types,"public.file-url"))||c.files&&0<c.files.length)))&&b.preventDefault()};
l.Sn=function(b){this.od&&(b.preventDefault(),b.a.dataTransfer.dropEffect="none")};l.Tn=function(b){if(this.od){b.preventDefault();b.b();b=b.a.dataTransfer;try{b.effectAllowed="all"}catch(c){}b.dropEffect="copy"}};l.Un=function(b){this.od&&(b.preventDefault(),b.b(),b=new wc(b.a),b.type="drop",this.s(b))};/*
 Portions of this code are from MochiKit, received by
 The Closure Authors under the MIT license. All other code is Copyright
 2005-2009 The Closure Authors. All Rights Reserved.
*/
function fy(b,c){this.g=[];this.v=b;this.B=c||null;this.c=this.a=!1;this.b=void 0;this.o=this.C=this.j=!1;this.i=0;this.f=null;this.l=0}fy.prototype.cancel=function(b){if(this.a)this.b instanceof fy&&this.b.cancel();else{if(this.f){var c=this.f;delete this.f;b?c.cancel(b):(c.l--,0>=c.l&&c.cancel())}this.v?this.v.call(this.B,this):this.o=!0;this.a||(b=new gy,hy(this),iy(this,!1,b))}};fy.prototype.G=function(b,c){this.j=!1;iy(this,b,c)};function iy(b,c,d){b.a=!0;b.b=d;b.c=!c;jy(b)}
function hy(b){if(b.a){if(!b.o)throw new ky;b.o=!1}}fy.prototype.cd=function(b){hy(this);iy(this,!0,b)};function ly(b,c,d,e){b.g.push([c,d,e]);b.a&&jy(b)}fy.prototype.then=function(b,c,d){var e,f,g=new Jn(function(b,c){e=b;f=c});ly(this,e,function(b){b instanceof gy?g.cancel():f(b)});return g.then(b,c,d)};wn(fy);function my(b){return db(b.g,function(b){return na(b[1])})}
function jy(b){if(b.i&&b.a&&my(b)){var c=b.i,d=ny[c];d&&(ba.clearTimeout(d.ya),delete ny[c]);b.i=0}b.f&&(b.f.l--,delete b.f);for(var c=b.b,e=d=!1;b.g.length&&!b.j;){var f=b.g.shift(),g=f[0],h=f[1],f=f[2];if(g=b.c?h:g)try{var k=g.call(f||b.B,c);ca(k)&&(b.c=b.c&&(k==c||k instanceof Error),b.b=c=k);if(xn(c)||"function"===typeof ba.Promise&&c instanceof ba.Promise)e=!0,b.j=!0}catch(m){c=m,b.c=!0,my(b)||(d=!0)}}b.b=c;e&&(k=ta(b.G,b,!0),e=ta(b.G,b,!1),c instanceof fy?(ly(c,k,e),c.C=!0):c.then(k,e));d&&
(c=new oy(c),ny[c.ya]=c,b.i=c.ya)}function ky(){za.call(this)}z(ky,za);ky.prototype.message="Deferred has already fired";ky.prototype.name="AlreadyCalledError";function gy(){za.call(this)}z(gy,za);gy.prototype.message="Deferred was canceled";gy.prototype.name="CanceledError";function oy(b){this.ya=ba.setTimeout(ta(this.f,this),0);this.a=b}oy.prototype.f=function(){delete ny[this.ya];throw this.a;};var ny={};function py(b,c){ca(b.name)?(this.name=b.name,this.code=qy[b.name]):(this.code=b.code,this.name=ry(b.code));za.call(this,Ca("%s %s",this.name,c))}z(py,za);function ry(b){var c=Mb(qy,function(c){return b==c});if(!ca(c))throw Error("Invalid code: "+b);return c}var qy={AbortError:3,EncodingError:5,InvalidModificationError:9,InvalidStateError:7,NotFoundError:1,NotReadableError:4,NoModificationAllowedError:6,PathExistsError:12,QuotaExceededError:10,SecurityError:2,SyntaxError:8,TypeMismatchError:11};function sy(b,c){rc.call(this,b.type,c)}z(sy,rc);function ty(){$c.call(this);this.vb=new FileReader;this.vb.onloadstart=ta(this.a,this);this.vb.onprogress=ta(this.a,this);this.vb.onload=ta(this.a,this);this.vb.onabort=ta(this.a,this);this.vb.onerror=ta(this.a,this);this.vb.onloadend=ta(this.a,this)}z(ty,$c);ty.prototype.getError=function(){return this.vb.error&&new py(this.vb.error,"reading file")};ty.prototype.a=function(b){this.s(new sy(b,this))};ty.prototype.X=function(){ty.da.X.call(this);delete this.vb};
function uy(b){var c=new fy;b.Sa("loadend",ua(function(b,c){var f=c.vb.result,g=c.getError();null==f||g?(hy(b),iy(b,!1,g)):b.cd(f);c.rc()},c,b));return c};function vy(b){b=b?b:{};Kk.call(this,{handleEvent:se});this.j=b.formatConstructors?b.formatConstructors:[];this.v=b.projection?Ee(b.projection):null;this.c=null;this.a=void 0}z(vy,Kk);vy.prototype.X=function(){this.a&&Wc(this.a);vy.da.X.call(this)};vy.prototype.l=function(b){b=b.a.dataTransfer.files;var c,d,e;c=0;for(d=b.length;c<d;++c){e=b[c];var f;f=e;var g=new ty,h=uy(g);g.vb.readAsText(f,"");f=h;e=ua(this.o,e);ly(f,e,null,this)}};
vy.prototype.o=function(b,c){var d=this.B,e=this.v;e||(e=d.aa().g);var d=this.j,f=[],g,h;g=0;for(h=d.length;g<h;++g){var k=new d[g],m;try{m=k.Ca(c)}catch(t){m=null}if(m){var k=k.Ka(c),k=We(k,e),n,p;n=0;for(p=m.length;n<p;++n){var q=m[n],r=q.W();r&&r.qc(k);f.push(q)}}}this.s(new wy(xy,this,b,f,e))};vy.prototype.setMap=function(b){this.a&&(Wc(this.a),this.a=void 0);this.c&&(qc(this.c),this.c=null);vy.da.setMap.call(this,b);b&&(this.c=new ey(b.a),this.a=D(this.c,"drop",this.l,!1,this))};var xy="addfeatures";
function wy(b,c,d,e,f){rc.call(this,b,c);this.features=e;this.file=d;this.projection=f}z(wy,rc);function yy(b,c){this.x=b;this.y=c}z(yy,wg);yy.prototype.clone=function(){return new yy(this.x,this.y)};yy.prototype.scale=wg.prototype.scale;yy.prototype.rotate=function(b){var c=Math.cos(b);b=Math.sin(b);var d=this.y*c+this.x*b;this.x=this.x*c-this.y*b;this.y=d;return this};function zy(b){b=b?b:{};Xk.call(this,{handleDownEvent:Ay,handleDragEvent:By,handleUpEvent:Cy});this.o=b.condition?b.condition:Uk;this.a=this.c=void 0;this.l=0;this.v=void 0!==b.duration?b.duration:400}z(zy,Xk);
function By(b){if(Wk(b)){var c=b.map,d=c.Ta();b=b.pixel;b=new yy(b[0]-d[0]/2,d[1]/2-b[1]);d=Math.atan2(b.y,b.x);b=Math.sqrt(b.x*b.x+b.y*b.y);var e=c.aa();c.render();if(void 0!==this.c){var f=d-this.c;Lk(c,e,e.Ha()-f)}this.c=d;void 0!==this.a&&(d=this.a*(e.$()/b),Nk(c,e,d));void 0!==this.a&&(this.l=this.a/b);this.a=b}}
function Cy(b){if(!Wk(b))return!0;b=b.map;var c=b.aa();Sf(c,-1);var d=this.l-1,e=c.Ha(),e=c.constrainRotation(e,0);Lk(b,c,e,void 0,void 0);var e=c.$(),f=this.v,e=c.constrainResolution(e,0,d);Nk(b,c,e,void 0,f);this.l=0;return!1}function Ay(b){return Wk(b)&&this.o(b)?(Sf(b.map.aa(),1),this.a=this.c=void 0,!0):!1};function Dy(b,c){rc.call(this,b);this.feature=c}z(Dy,rc);
function Ey(b){Xk.call(this,{handleDownEvent:Fy,handleEvent:Gy,handleUpEvent:Hy});this.ia=null;this.T=!1;this.oc=b.source?b.source:null;this.Fb=b.features?b.features:null;this.pj=b.snapTolerance?b.snapTolerance:12;this.Y=b.type;this.c=Iy(this.Y);this.jb=b.minPoints?b.minPoints:this.c===Jy?3:2;this.xa=b.maxPoints?b.maxPoints:Infinity;var c=b.geometryFunction;if(!c)if("Circle"===this.Y)c=function(b,c){var d=c?c:new Sx([NaN,NaN]);d.Yf(b[0],Math.sqrt(ud(b[0],b[1])));return d};else{var d,c=this.c;c===
Ky?d=F:c===Ly?d=U:c===Jy&&(d=G);c=function(b,c){var g=c;g?g.ma(b):g=new d(b);return g}}this.D=c;this.U=this.v=this.a=this.O=this.l=this.o=null;this.yj=b.clickTolerance?b.clickTolerance*b.clickTolerance:36;this.qa=new J({source:new Jp({useSpatialIndex:!1,wrapX:b.wrapX?b.wrapX:!1}),style:b.style?b.style:My()});this.Gb=b.geometryName;this.Ji=b.condition?b.condition:Tk;this.na=b.freehandCondition?b.freehandCondition:Uk;D(this,hd("active"),this.vi,!1,this)}z(Ey,Xk);
function My(){var b=jm();return function(c){return b[c.W().V()]}}l=Ey.prototype;l.setMap=function(b){Ey.da.setMap.call(this,b);this.vi()};function Gy(b){var c=!this.T;this.T&&b.type===Vj?(Ny(this,b),c=!1):b.type===Uj?c=Oy(this,b):b.type===Oj&&(c=!1);return Yk.call(this,b)&&c}function Fy(b){if(this.Ji(b))return this.ia=b.pixel,!0;if(this.c!==Ly&&this.c!==Jy||!this.na(b))return!1;this.ia=b.pixel;this.T=!0;this.o||Py(this,b);return!0}
function Hy(b){this.T=!1;var c=this.ia,d=b.pixel,e=c[0]-d[0],c=c[1]-d[1],d=!0;e*e+c*c<=this.yj&&(Oy(this,b),this.o?this.c===Qy?this.qd():Ry(this,b)?this.qd():Ny(this,b):(Py(this,b),this.c===Ky&&this.qd()),d=!1);return d}
function Oy(b,c){if(b.o){var d=c.coordinate,e=b.l.W(),f;b.c===Ky?f=b.a:b.c===Jy?(f=b.a[0],f=f[f.length-1],Ry(b,c)&&(d=b.o.slice())):(f=b.a,f=f[f.length-1]);f[0]=d[0];f[1]=d[1];b.D(b.a,e);b.O&&b.O.W().ma(d);e instanceof G&&b.c!==Jy?(b.v||(b.v=new un(new U(null))),e=e.Hg(0),d=b.v.W(),d.ba(e.b,e.ja())):b.U&&(d=b.v.W(),d.ma(b.U));Sy(b)}else d=c.coordinate.slice(),b.O?b.O.W().ma(d):(b.O=new un(new F(d)),Sy(b));return!0}
function Ry(b,c){var d=!1;if(b.l){var e=!1,f=[b.o];b.c===Ly?e=b.a.length>b.jb:b.c===Jy&&(e=b.a[0].length>b.jb,f=[b.a[0][0],b.a[0][b.a[0].length-2]]);if(e)for(var e=c.map,g=0,h=f.length;g<h;g++){var k=f[g],m=e.Ra(k),n=c.pixel,d=n[0]-m[0],m=n[1]-m[1],n=b.T&&b.na(c)?1:b.pj;if(d=Math.sqrt(d*d+m*m)<=n){b.o=k;break}}}return d}
function Py(b,c){var d=c.coordinate;b.o=d;b.c===Ky?b.a=d.slice():b.c===Jy?(b.a=[[d.slice(),d.slice()]],b.U=b.a[0]):(b.a=[d.slice(),d.slice()],b.c===Qy&&(b.U=b.a));b.U&&(b.v=new un(new U(b.U)));d=b.D(b.a);b.l=new un;b.Gb&&b.l.Cc(b.Gb);b.l.Oa(d);Sy(b);b.s(new Dy("drawstart",b.l))}
function Ny(b,c){var d=c.coordinate,e=b.l.W(),f,g;if(b.c===Ly)b.o=d.slice(),g=b.a,g.push(d.slice()),f=g.length>b.xa,b.D(g,e);else if(b.c===Jy){g=b.a[0];g.push(d.slice());if(f=g.length>b.xa)b.o=g[0];b.D(b.a,e)}Sy(b);f&&b.qd()}l.Io=function(){var b=this.l.W(),c,d;this.c===Ly?(c=this.a,c.splice(-2,1),this.D(c,b)):this.c===Jy&&(c=this.a[0],c.splice(-2,1),d=this.v.W(),d.ma(c),this.D(this.a,b));0===c.length&&(this.o=null);Sy(this)};
l.qd=function(){var b=Ty(this),c=this.a,d=b.W();this.c===Ly?(c.pop(),this.D(c,d)):this.c===Jy&&(c[0].pop(),c[0].push(c[0][0]),this.D(c,d));"MultiPoint"===this.Y?b.Oa(new bs([c])):"MultiLineString"===this.Y?b.Oa(new V([c])):"MultiPolygon"===this.Y&&b.Oa(new cs([c]));this.s(new Dy("drawend",b));this.Fb&&this.Fb.push(b);this.oc&&this.oc.Dd(b)};function Ty(b){b.o=null;var c=b.l;c&&(b.l=null,b.O=null,b.v=null,b.qa.ea().clear(!0));return c}
l.nm=function(b){var c=b.W();this.l=b;this.a=c.Z();b=this.a[this.a.length-1];this.o=b.slice();this.a.push(b.slice());Sy(this);this.s(new Dy("drawstart",this.l))};l.Ec=re;function Sy(b){var c=[];b.l&&c.push(b.l);b.v&&c.push(b.v);b.O&&c.push(b.O);b=b.qa.ea();b.clear(!0);b.Ic(c)}l.vi=function(){var b=this.B,c=this.b();b&&c||Ty(this);this.qa.setMap(c?b:null)};
function Iy(b){var c;"Point"===b||"MultiPoint"===b?c=Ky:"LineString"===b||"MultiLineString"===b?c=Ly:"Polygon"===b||"MultiPolygon"===b?c=Jy:"Circle"===b&&(c=Qy);return c}var Ky="Point",Ly="LineString",Jy="Polygon",Qy="Circle";function Uy(b,c,d){rc.call(this,b);this.features=c;this.mapBrowserPointerEvent=d}z(Uy,rc);
function Vy(b){Xk.call(this,{handleDownEvent:Wy,handleDragEvent:Xy,handleEvent:Yy,handleUpEvent:Zy});this.xa=b.deleteCondition?b.deleteCondition:xe(Tk,Sk);this.na=this.c=null;this.ia=[0,0];this.D=this.T=!1;this.a=new Dp;this.O=void 0!==b.pixelTolerance?b.pixelTolerance:10;this.o=this.qa=!1;this.l=null;this.U=new J({source:new Jp({useSpatialIndex:!1,wrapX:!!b.wrapX}),style:b.style?b.style:$y(),updateWhileAnimating:!0,updateWhileInteracting:!0});this.Y={Point:this.um,LineString:this.kh,LinearRing:this.kh,
Polygon:this.vm,MultiPoint:this.sm,MultiLineString:this.rm,MultiPolygon:this.tm,GeometryCollection:this.qm};this.v=b.features;this.v.forEach(this.Ef,this);D(this.v,"add",this.om,!1,this);D(this.v,"remove",this.pm,!1,this)}z(Vy,Xk);l=Vy.prototype;l.Ef=function(b){var c=b.W();c.V()in this.Y&&this.Y[c.V()].call(this,b,c);(c=this.B)&&az(this,this.ia,c);D(b,"change",this.jh,!1,this)};function bz(b,c){b.D||(b.D=!0,b.s(new Uy("modifystart",b.v,c)))}
function cz(b,c){dz(b,c);b.c&&0===b.v.bc()&&(b.U.ea().Sc(b.c),b.c=null);Vc(c,"change",b.jh,!1,b)}function dz(b,c){var d=b.a,e=[];d.forEach(function(b){c===b.feature&&e.push(b)});for(var f=e.length-1;0<=f;--f)d.remove(e[f])}l.setMap=function(b){this.U.setMap(b);Vy.da.setMap.call(this,b)};l.om=function(b){this.Ef(b.element)};l.jh=function(b){this.o||(b=b.target,cz(this,b),this.Ef(b))};l.pm=function(b){cz(this,b.element)};
l.um=function(b,c){var d=c.Z(),d={feature:b,geometry:c,la:[d,d]};this.a.za(c.J(),d)};l.sm=function(b,c){var d=c.Z(),e,f,g;f=0;for(g=d.length;f<g;++f)e=d[f],e={feature:b,geometry:c,depth:[f],index:f,la:[e,e]},this.a.za(c.J(),e)};l.kh=function(b,c){var d=c.Z(),e,f,g,h;e=0;for(f=d.length-1;e<f;++e)g=d.slice(e,e+2),h={feature:b,geometry:c,index:e,la:g},this.a.za(Kd(g),h)};
l.rm=function(b,c){var d=c.Z(),e,f,g,h,k,m,n;h=0;for(k=d.length;h<k;++h)for(e=d[h],f=0,g=e.length-1;f<g;++f)m=e.slice(f,f+2),n={feature:b,geometry:c,depth:[h],index:f,la:m},this.a.za(Kd(m),n)};l.vm=function(b,c){var d=c.Z(),e,f,g,h,k,m,n;h=0;for(k=d.length;h<k;++h)for(e=d[h],f=0,g=e.length-1;f<g;++f)m=e.slice(f,f+2),n={feature:b,geometry:c,depth:[h],index:f,la:m},this.a.za(Kd(m),n)};
l.tm=function(b,c){var d=c.Z(),e,f,g,h,k,m,n,p,q,r;m=0;for(n=d.length;m<n;++m)for(p=d[m],h=0,k=p.length;h<k;++h)for(e=p[h],f=0,g=e.length-1;f<g;++f)q=e.slice(f,f+2),r={feature:b,geometry:c,depth:[h,m],index:f,la:q},this.a.za(Kd(q),r)};l.qm=function(b,c){var d,e=c.c;for(d=0;d<e.length;++d)this.Y[e[d].V()].call(this,b,e[d])};function ez(b,c){var d=b.c;d?d.W().ma(c):(d=new un(new F(c)),b.c=d,b.U.ea().Dd(d))}function fz(b,c){return b.index-c.index}
function Wy(b){az(this,b.pixel,b.map);this.l=[];this.D=!1;var c=this.c;if(c){var d=[],c=c.W().Z(),e=Kd([c]),e=Gp(this.a,e),f={};e.sort(fz);for(var g=0,h=e.length;g<h;++g){var k=e[g],m=k.la,n=w(k.feature),p=k.depth;p&&(n+="-"+p.join("-"));f[n]||(f[n]=Array(2));if(sd(m[0],c)&&!f[n][0])this.l.push([k,0]),f[n][0]=k;else if(sd(m[1],c)&&!f[n][1]){if("LineString"!==k.geometry.V()&&"MultiLineString"!==k.geometry.V()||!f[n][0]||0!==f[n][0].index)this.l.push([k,1]),f[n][1]=k}else w(m)in this.na&&!f[n][0]&&
!f[n][1]&&d.push([k,c])}d.length&&bz(this,b);for(b=d.length-1;0<=b;--b)this.ml.apply(this,d[b])}return!!this.c}
function Xy(b){this.T=!1;bz(this,b);b=b.coordinate;for(var c=0,d=this.l.length;c<d;++c){for(var e=this.l[c],f=e[0],g=f.depth,h=f.geometry,k=h.Z(),m=f.la,e=e[1];b.length<h.sa();)b.push(0);switch(h.V()){case "Point":k=b;m[0]=m[1]=b;break;case "MultiPoint":k[f.index]=b;m[0]=m[1]=b;break;case "LineString":k[f.index+e]=b;m[e]=b;break;case "MultiLineString":k[g[0]][f.index+e]=b;m[e]=b;break;case "Polygon":k[g[0]][f.index+e]=b;m[e]=b;break;case "MultiPolygon":k[g[1]][g[0]][f.index+e]=b,m[e]=b}f=h;this.o=
!0;f.ma(k);this.o=!1}ez(this,b)}function Zy(b){for(var c,d=this.l.length-1;0<=d;--d)c=this.l[d][0],Ep(this.a,Kd(c.la),c);this.D&&(this.s(new Uy("modifyend",this.v,b)),this.D=!1);return!1}
function Yy(b){if(!(b instanceof Kj))return!0;var c;b.map.aa().b.slice()[1]||b.type!=Uj||this.C||(this.ia=b.pixel,az(this,b.pixel,b.map));if(this.c&&this.xa(b))if(b.type==Pj&&this.T)c=!0;else{this.c.W();bz(this,b);c=this.l;var d={},e,f,g,h,k,m,n,p,q;for(k=c.length-1;0<=k;--k)if(g=c[k],p=g[0],h=p.geometry,f=h.Z(),q=w(p.feature),p.depth&&(q+="-"+p.depth.join("-")),n=e=m=void 0,0===g[1]?(e=p,m=p.index):1==g[1]&&(n=p,m=p.index+1),q in d||(d[q]=[n,e,m]),g=d[q],void 0!==n&&(g[0]=n),void 0!==e&&(g[1]=e),
void 0!==g[0]&&void 0!==g[1]){e=f;q=!1;n=m-1;switch(h.V()){case "MultiLineString":f[p.depth[0]].splice(m,1);q=!0;break;case "LineString":f.splice(m,1);q=!0;break;case "MultiPolygon":e=e[p.depth[1]];case "Polygon":e=e[p.depth[0]],4<e.length&&(m==e.length-1&&(m=0),e.splice(m,1),q=!0,0===m&&(e.pop(),e.push(e[0]),n=e.length-1))}q&&(this.a.remove(g[0]),this.a.remove(g[1]),e=h,this.o=!0,e.ma(f),this.o=!1,f={depth:p.depth,feature:p.feature,geometry:p.geometry,index:n,la:[g[0].la[0],g[1].la[1]]},this.a.za(Kd(f.la),
f),gz(this,h,m,p.depth,-1),this.c&&(this.U.ea().Sc(this.c),this.c=null))}c=!0;this.s(new Uy("modifyend",this.v,b));this.D=!1}b.type==Pj&&(this.T=!1);return Yk.call(this,b)&&!c}
function az(b,c,d){function e(b,c){return vd(f,b.la)-vd(f,c.la)}var f=d.Ia(c),g=d.Ia([c[0]-b.O,c[1]+b.O]),h=d.Ia([c[0]+b.O,c[1]-b.O]),g=Kd([g,h]),g=Gp(b.a,g);if(0<g.length){g.sort(e);var h=g[0].la,k=pd(f,h),m=d.Ra(k);if(Math.sqrt(ud(c,m))<=b.O){c=d.Ra(h[0]);d=d.Ra(h[1]);c=ud(m,c);d=ud(m,d);b.qa=Math.sqrt(Math.min(c,d))<=b.O;b.qa&&(k=c>d?h[1]:h[0]);ez(b,k);d={};d[w(h)]=!0;c=1;for(m=g.length;c<m;++c)if(k=g[c].la,sd(h[0],k[0])&&sd(h[1],k[1])||sd(h[0],k[1])&&sd(h[1],k[0]))d[w(k)]=!0;else break;b.na=d;
return}}b.c&&(b.U.ea().Sc(b.c),b.c=null)}
l.ml=function(b,c){for(var d=b.la,e=b.feature,f=b.geometry,g=b.depth,h=b.index,k;c.length<f.sa();)c.push(0);switch(f.V()){case "MultiLineString":k=f.Z();k[g[0]].splice(h+1,0,c);break;case "Polygon":k=f.Z();k[g[0]].splice(h+1,0,c);break;case "MultiPolygon":k=f.Z();k[g[1]][g[0]].splice(h+1,0,c);break;case "LineString":k=f.Z();k.splice(h+1,0,c);break;default:return}this.o=!0;f.ma(k);this.o=!1;k=this.a;k.remove(b);gz(this,f,h,g,1);var m={la:[d[0],c],feature:e,geometry:f,depth:g,index:h};k.za(Kd(m.la),
m);this.l.push([m,1]);d={la:[c,d[1]],feature:e,geometry:f,depth:g,index:h+1};k.za(Kd(d.la),d);this.l.push([d,0]);this.T=!0};function gz(b,c,d,e,f){Ip(b.a,c.J(),function(b){b.geometry===c&&(void 0===e||void 0===b.depth||qb(b.depth,e))&&b.index>d&&(b.index+=f)})}function $y(){var b=jm();return function(){return b.Point}};function hz(b,c,d,e){rc.call(this,b);this.selected=c;this.deselected=d;this.mapBrowserEvent=e}z(hz,rc);
function iz(b){Kk.call(this,{handleEvent:jz});var c=b?b:{};this.C=c.condition?c.condition:Sk;this.o=c.addCondition?c.addCondition:re;this.D=c.removeCondition?c.removeCondition:re;this.O=c.toggleCondition?c.toggleCondition:Uk;this.v=c.multi?c.multi:!1;this.j=c.filter?c.filter:se;var d=new J({source:new Jp({useSpatialIndex:!1,features:c.features,wrapX:c.wrapX}),style:c.style?c.style:kz(),updateWhileAnimating:!0,updateWhileInteracting:!0});this.c=d;if(c.layers)if(na(c.layers))b=function(b){return b===
d||c.layers(b)};else{var e=c.layers;b=function(b){return b===d||ub(e,b)}}else b=se;this.l=b;this.a={};b=this.c.ea().c;D(b,"add",this.wm,!1,this);D(b,"remove",this.zm,!1,this)}z(iz,Kk);l=iz.prototype;l.xm=function(){return this.c.ea().c};l.ym=function(b){b=w(b);return this.a[b]};
function jz(b){if(!this.C(b))return!0;var c=this.o(b),d=this.D(b),e=this.O(b),f=!c&&!d&&!e,g=b.map,h=this.c.ea().c,k=[],m=[],n=!1;if(f)g.rd(b.pixel,function(b,c){if(this.j(b,c)){m.push(b);var d=w(b);this.a[d]=c;return!this.v}},this,this.l),0<m.length&&1==h.bc()&&h.item(0)==m[0]||(n=!0,0!==h.bc()&&(k=Array.prototype.concat(h.a),h.clear()),h.zf(m),0===m.length?Ob(this.a):0<k.length&&k.forEach(function(b){b=w(b);delete this.a[b]},this));else{g.rd(b.pixel,function(b,f){if(f!==this.c){if((c||e)&&this.j(b,
f)&&!ub(h.a,b)&&!ub(m,b)){m.push(b);var g=w(b);this.a[g]=f}}else if(d||e)k.push(b),g=w(b),delete this.a[g]},this,this.l);for(f=k.length-1;0<=f;--f)h.remove(k[f]);h.zf(m);if(0<m.length||0<k.length)n=!0}n&&this.s(new hz("select",m,k,b));return Rk(b)}l.setMap=function(b){var c=this.B,d=this.c.ea().c;c&&d.forEach(c.ti,c);iz.da.setMap.call(this,b);this.c.setMap(b);b&&d.forEach(b.pi,b)};
function kz(){var b=jm();jb(b.Polygon,b.LineString);jb(b.GeometryCollection,b.LineString);return function(c){return b[c.W().V()]}}l.wm=function(b){b=b.element;var c=this.B;c&&c.pi(b)};l.zm=function(b){b=b.element;var c=this.B;c&&c.ti(b)};function lz(b){Xk.call(this,{handleEvent:mz,handleDownEvent:se,handleUpEvent:nz});b=b?b:{};this.o=b.source?b.source:null;this.l=b.features?b.features:null;this.ia=[];this.D={};this.O={};this.T={};this.v={};this.U=null;this.c=void 0!==b.pixelTolerance?b.pixelTolerance:10;this.qa=oz.bind(this);this.a=new Dp;this.Y={Point:this.Fm,LineString:this.nh,LinearRing:this.nh,Polygon:this.Gm,MultiPoint:this.Dm,MultiLineString:this.Cm,MultiPolygon:this.Em,GeometryCollection:this.Bm}}z(lz,Xk);l=lz.prototype;
l.zd=function(b,c){var d=void 0!==c?c:!0,e=b.W(),f=this.Y[e.V()];if(f){var g=w(b);this.T[g]=e.J(Ld());f.call(this,b,e);d&&(this.O[g]=e.H("change",this.Ik.bind(this,b),this),this.D[g]=b.H(hd(b.a),this.Am,this))}};l.Gj=function(b){this.zd(b)};l.Hj=function(b){this.Ad(b)};l.lh=function(b){var c;b instanceof Op?c=b.feature:b instanceof lg&&(c=b.element);this.zd(c)};l.mh=function(b){var c;b instanceof Op?c=b.feature:b instanceof lg&&(c=b.element);this.Ad(c)};
l.Am=function(b){b=b.g;this.Ad(b,!0);this.zd(b,!0)};l.Ik=function(b){if(this.C){var c=w(b);c in this.v||(this.v[c]=b)}else this.ui(b)};l.Ad=function(b,c){var d=void 0!==c?c:!0,e=w(b),f=this.T[e];if(f){var g=this.a,h=[];Ip(g,f,function(c){b===c.feature&&h.push(c)});for(f=h.length-1;0<=f;--f)g.remove(h[f]);d&&(Wc(this.O[e]),delete this.O[e],Wc(this.D[e]),delete this.D[e])}};
l.setMap=function(b){var c=this.B,d=this.ia,e;this.l?e=this.l:this.o&&(e=this.o.Be());c&&(d.forEach(dd),d.length=0,e.forEach(this.Hj,this));lz.da.setMap.call(this,b);b&&(this.l?(d.push(this.l.H("add",this.lh,this)),d.push(this.l.H("remove",this.mh,this))):this.o&&(d.push(this.o.H("addfeature",this.lh,this)),d.push(this.o.H("removefeature",this.mh,this))),e.forEach(this.Gj,this))};l.Ec=re;l.ui=function(b){this.Ad(b,!1);this.zd(b,!1)};
l.Bm=function(b,c){var d,e=c.c;for(d=0;d<e.length;++d)this.Y[e[d].V()].call(this,b,e[d])};l.nh=function(b,c){var d=c.Z(),e,f,g,h;e=0;for(f=d.length-1;e<f;++e)g=d.slice(e,e+2),h={feature:b,la:g},this.a.za(Kd(g),h)};l.Cm=function(b,c){var d=c.Z(),e,f,g,h,k,m,n;h=0;for(k=d.length;h<k;++h)for(e=d[h],f=0,g=e.length-1;f<g;++f)m=e.slice(f,f+2),n={feature:b,la:m},this.a.za(Kd(m),n)};l.Dm=function(b,c){var d=c.Z(),e,f,g;f=0;for(g=d.length;f<g;++f)e=d[f],e={feature:b,la:[e,e]},this.a.za(c.J(),e)};
l.Em=function(b,c){var d=c.Z(),e,f,g,h,k,m,n,p,q,r;m=0;for(n=d.length;m<n;++m)for(p=d[m],h=0,k=p.length;h<k;++h)for(e=p[h],f=0,g=e.length-1;f<g;++f)q=e.slice(f,f+2),r={feature:b,la:q},this.a.za(Kd(q),r)};l.Fm=function(b,c){var d=c.Z(),d={feature:b,la:[d,d]};this.a.za(c.J(),d)};l.Gm=function(b,c){var d=c.Z(),e,f,g,h,k,m,n;h=0;for(k=d.length;h<k;++h)for(e=d[h],f=0,g=e.length-1;f<g;++f)m=e.slice(f,f+2),n={feature:b,la:m},this.a.za(Kd(m),n)};
function mz(b){var c,d,e=b.pixel,f=b.coordinate;c=b.map;var g=c.Ia([e[0]-this.c,e[1]+this.c]);d=c.Ia([e[0]+this.c,e[1]-this.c]);var g=Kd([g,d]),h=Gp(this.a,g),k=!1,g=!1,m=null;d=null;0<h.length&&(this.U=f,h.sort(this.qa),h=h[0].la,m=pd(f,h),d=c.Ra(m),Math.sqrt(ud(e,d))<=this.c&&(g=!0,e=c.Ra(h[0]),f=c.Ra(h[1]),e=ud(d,e),f=ud(d,f),k=Math.sqrt(Math.min(e,f))<=this.c))&&(m=e>f?h[1]:h[0],d=c.Ra(m),d=[Math.round(d[0]),Math.round(d[1])]);c=m;g&&(b.coordinate=c.slice(0,2),b.pixel=d);return Yk.call(this,b)}
function nz(){var b=Kb(this.v);b.length&&(b.forEach(this.ui,this),this.v={});return!1}function oz(b,c){return vd(this.U,b.la)-vd(this.U,c.la)};function pz(b,c,d){rc.call(this,b);this.features=c;this.coordinate=d}z(pz,rc);function qz(b){Xk.call(this,{handleDownEvent:rz,handleDragEvent:sz,handleMoveEvent:tz,handleUpEvent:uz});this.o=void 0;this.a=null;this.c=void 0!==b.features?b.features:null;this.l=null}z(qz,Xk);function rz(b){this.l=vz(this,b.pixel,b.map);return!this.a&&this.l?(this.a=b.coordinate,tz.call(this,b),this.s(new pz("translatestart",this.c,b.coordinate)),!0):!1}
function uz(b){return this.a?(this.a=null,tz.call(this,b),this.s(new pz("translateend",this.c,b.coordinate)),!0):!1}function sz(b){if(this.a){b=b.coordinate;var c=b[0]-this.a[0],d=b[1]-this.a[1];if(this.c)this.c.forEach(function(b){var e=b.W();e.Qc(c,d);b.Oa(e)});else if(this.l){var e=this.l.W();e.Qc(c,d);this.l.Oa(e)}this.a=b;this.s(new pz("translating",this.c,b))}}
function tz(b){var c=b.map.uc();if(b=b.map.rd(b.pixel,function(b){return b})){var d=!1;this.c&&ub(this.c.a,b)&&(d=!0);this.o=c.style.cursor;c.style.cursor=this.a?"-webkit-grabbing":d?"-webkit-grab":"pointer";c.style.cursor=this.a?d?"grab":"pointer":"grabbing"}else c.style.cursor=void 0!==this.o?this.o:"",this.o=void 0}function vz(b,c,d){var e=null;c=d.rd(c,function(b){return b});b.c&&ub(b.c.a,c)&&(e=c);return e};function X(b){b=b?b:{};var c=Rb(b);delete c.gradient;delete c.radius;delete c.blur;delete c.shadow;delete c.weight;J.call(this,c);this.g=null;this.Y=void 0!==b.shadow?b.shadow:250;this.T=void 0;this.U=null;D(this,hd("gradient"),this.Jk,!1,this);this.fi(b.gradient?b.gradient:wz);this.ai(void 0!==b.blur?b.blur:15);this.qh(void 0!==b.radius?b.radius:8);D(this,[hd("blur"),hd("radius")],this.Sg,!1,this);this.Sg();var d=b.weight?b.weight:"weight",e;la(d)?e=function(b){return b.get(d)}:e=d;this.c(function(b){b=
e(b);b=void 0!==b?Ra(b,0,1):1;var c=255*b|0,d=this.U[c];d||(d=[new em({image:new sk({opacity:b,src:this.T})})],this.U[c]=d);return d}.bind(this));this.set("renderOrder",null);D(this,"render",this.bl,!1,this)}z(X,J);var wz=["#00f","#0ff","#0f0","#ff0","#f00"];l=X.prototype;l.yg=function(){return this.get("blur")};l.Gg=function(){return this.get("gradient")};l.ph=function(){return this.get("radius")};
l.Jk=function(){for(var b=this.Gg(),c=Mi(1,256),d=c.createLinearGradient(0,0,1,256),e=1/(b.length-1),f=0,g=b.length;f<g;++f)d.addColorStop(f*e,b[f]);c.fillStyle=d;c.fillRect(0,0,1,256);this.g=c.getImageData(0,0,1,256).data};l.Sg=function(){var b=this.ph(),c=this.yg(),d=b+c+1,e=2*d,e=Mi(e,e);e.shadowOffsetX=e.shadowOffsetY=this.Y;e.shadowBlur=c;e.shadowColor="#000";e.beginPath();c=d-this.Y;e.arc(c,c,b,0,2*Math.PI,!0);e.fill();this.T=e.canvas.toDataURL();this.U=Array(256);this.u()};
l.bl=function(b){b=b.context;var c=b.canvas,c=b.getImageData(0,0,c.width,c.height),d=c.data,e,f,g;e=0;for(f=d.length;e<f;e+=4)if(g=4*d[e+3])d[e]=this.g[g],d[e+1]=this.g[g+1],d[e+2]=this.g[g+2];b.putImageData(c,0,0)};l.ai=function(b){this.set("blur",b)};l.fi=function(b){this.set("gradient",b)};l.qh=function(b){this.set("radius",b)};function xz(b,c,d,e,f,g,h,k,m,n){sh.call(this,f,0);this.D=void 0!==n?n:!1;this.C=h;this.i=null;this.g={};this.j=c;this.o=e;this.G=g?g:f;this.f=[];this.b=null;this.l=0;g=e.Ba(this.G);n=this.o.J();f=this.j.J();g=n?me(g,n):g;if(0===ge(g))this.state=4;else if((n=b.J())&&(f?f=me(f,n):f=n),e=e.$(this.G[0]),e=dn(b,d,ke(g),e),!isFinite(e)||isNaN(e)||0>=e)this.state=4;else if(this.B=new gn(b,d,g,f,e*(void 0!==m?m:.5)),0===this.B.c.length)this.state=4;else if(this.l=Gh(c,e),d=jn(this.B),f&&(b.f?(d[1]=Ra(d[1],
f[1],f[3]),d[3]=Ra(d[3],f[1],f[3])):d=me(d,f)),ge(d))if(b=Bh(c,d,this.l),100>ig(b)*hg(b)){for(c=b.a;c<=b.c;c++)for(d=b.f;d<=b.b;d++)(m=k(this.l,c,d,h))&&this.f.push(m);0===this.f.length&&(this.state=4)}else this.state=3;else this.state=4}z(xz,sh);xz.prototype.X=function(){1==this.state&&(this.b.forEach(Wc),this.b=null);xz.da.X.call(this)};xz.prototype.Ua=function(b){if(void 0!==b){var c=w(b);if(c in this.g)return this.g[c];b=Nb(this.g)?this.i:this.i.cloneNode(!1);return this.g[c]=b}return this.i};
xz.prototype.v=function(){var b=[];this.f.forEach(function(c){c&&2==c.state&&b.push({extent:this.j.Ba(c.ga),image:c.Ua()})},this);this.f.length=0;var c=this.G[0],d=this.o.Ma(c),e=ma(d)?d:d[0],d=ma(d)?d:d[1],c=this.o.$(c),f=this.j.$(this.l),g=this.o.Ba(this.G);this.i=fn(e,d,this.C,f,this.j.J(),c,g,this.B,b,this.D);this.state=2;th(this)};
xz.prototype.load=function(){if(0==this.state){this.state=1;th(this);var b=0;this.b=[];this.f.forEach(function(c){var d=c.state;if(0==d||1==d){b++;var e;e=c.Sa("change",function(){var d=c.state;if(2==d||3==d||4==d)Wc(e),b--,0===b&&(this.b.forEach(Wc),this.b=null,this.v())},!1,this);this.b.push(e)}},this);this.f.forEach(function(b){0==b.state&&b.load()});0===b&&ba.setTimeout(this.v.bind(this),0)}};function yz(b,c){var d=c||{},e=d.document||document,f=document.createElement("SCRIPT"),g={$h:f,Fc:void 0},h=new fy(zz,g),k=null,m=null!=d.timeout?d.timeout:5E3;0<m&&(k=window.setTimeout(function(){Az(f,!0);var c=new Bz(Cz,"Timeout reached for loading script "+b);hy(h);iy(h,!1,c)},m),g.Fc=k);f.onload=f.onreadystatechange=function(){f.readyState&&"loaded"!=f.readyState&&"complete"!=f.readyState||(Az(f,d.Bj||!1,k),h.cd(null))};f.onerror=function(){Az(f,!0,k);var c=new Bz(Dz,"Error while loading script "+
b);hy(h);iy(h,!1,c)};g=d.attributes||{};Ub(g,{type:"text/javascript",charset:"UTF-8",src:b});Cg(f,g);Ez(e).appendChild(f);return h}function Ez(b){var c=b.getElementsByTagName("HEAD");return c&&0!=c.length?c[0]:b.documentElement}function zz(){if(this&&this.$h){var b=this.$h;b&&"SCRIPT"==b.tagName&&Az(b,!0,this.Fc)}}function Az(b,c,d){null!=d&&ba.clearTimeout(d);b.onload=da;b.onerror=da;b.onreadystatechange=da;c&&window.setTimeout(function(){Kg(b)},0)}var Dz=0,Cz=1;
function Bz(b,c){var d="Jsloader error (code #"+b+")";c&&(d+=": "+c);za.call(this,d);this.code=b}z(Bz,za);function Fz(b,c){this.f=new It(b);this.a=c?c:"callback";this.Fc=5E3}var Gz=0;function Hz(b,c,d,e){c=c||null;var f="_"+(Gz++).toString(36)+va().toString(36);ba._callbacks_||(ba._callbacks_={});var g=b.f.clone();if(c)for(var h in c)if(!c.hasOwnProperty||c.hasOwnProperty(h)){var k=g,m=h,n=c[h];ia(n)||(n=[String(n)]);au(k.b,m,n)}d&&(ba._callbacks_[f]=Iz(f,d),d=b.a,h="_callbacks_."+f,ia(h)||(h=[String(h)]),au(g.b,d,h));b=yz(g.toString(),{timeout:b.Fc,Bj:!0});ly(b,null,Jz(f,c,e),void 0)}
Fz.prototype.cancel=function(b){b&&(b.Cj&&b.Cj.cancel(),b.ya&&Kz(b.ya,!1))};function Jz(b,c,d){return function(){Kz(b,!1);d&&d(c)}}function Iz(b,c){return function(d){Kz(b,!0);c.apply(void 0,arguments)}}function Kz(b,c){ba._callbacks_[b]&&(c?delete ba._callbacks_[b]:ba._callbacks_[b]=da)};function Y(b){aq.call(this,{attributions:b.attributions,extent:b.extent,logo:b.logo,opaque:b.opaque,projection:b.projection,state:void 0!==b.state?b.state:void 0,tileGrid:b.tileGrid,tileLoadFunction:b.tileLoadFunction?b.tileLoadFunction:Lz,tilePixelRatio:b.tilePixelRatio,tileUrlFunction:b.tileUrlFunction,url:b.url,urls:b.urls,wrapX:b.wrapX});this.crossOrigin=void 0!==b.crossOrigin?b.crossOrigin:null;this.tileClass=void 0!==b.tileClass?b.tileClass:cy;this.j={};this.o={};this.na=b.reprojectionErrorThreshold;
this.D=!1}z(Y,aq);l=Y.prototype;l.wh=function(){return qh(this.a)?!0:Ib(this.j,function(b){return qh(b)})};l.xh=function(b,c){var d=this.wd(b);rh(this.a,this.a==d?c:{});Hb(this.j,function(b){rh(b,b==d?c:{})})};l.tf=function(b){return this.b&&b&&!Ve(this.b,b)?!1:Y.da.tf.call(this,b)};l.kb=function(b){var c=this.b;return!this.tileGrid||c&&!Ve(c,b)?(c=w(b).toString(),c in this.o||(this.o[c]=Hh(b)),this.o[c]):this.tileGrid};
l.wd=function(b){var c=this.b;if(!c||Ve(c,b))return this.a;b=w(b).toString();b in this.j||(this.j[b]=new ph);return this.j[b]};function Mz(b,c,d,e,f,g,h){c=[c,d,e];f=(d=Oh(b,c,g))?b.tileUrlFunction(d,f,g):void 0;f=new b.tileClass(c,void 0!==f?0:4,void 0!==f?f:"",b.crossOrigin,b.tileLoadFunction);f.key=h;D(f,"change",b.yh,!1,b);return f}
l.Qb=function(b,c,d,e,f){if(this.b&&f&&!Ve(this.b,f)){var g=this.wd(f);c=[b,c,d];b=this.Cb.apply(this,c);if(oh(g,b))return g.get(b);var h=this.b;d=this.kb(h);var k=this.kb(f),m=Oh(this,c,f);e=new xz(h,d,f,k,c,m,this.vc(e),function(b,c,d,e){return Nz(this,b,c,d,e,h)}.bind(this),this.na,this.D);g.set(b,e);return e}return Nz(this,b,c,d,e,f)};
function Nz(b,c,d,e,f,g){var h=null,k=b.Cb(c,d,e),m=b.rf();if(oh(b.a,k)){if(h=b.a.get(k),h.key!=m){var n=h;h.a&&h.a.key==m?(h=h.a,2==n.state&&(h.a=n)):(h=Mz(b,c,d,e,f,g,m),2==n.state?h.a=n:n.a&&2==n.a.state&&(h.a=n.a,n.a=null));h.a&&(h.a.a=null);b.a.replace(k,h)}}else h=Mz(b,c,d,e,f,g,m),b.a.set(k,h);return h}l.xb=function(b){this.D!=b&&(this.D=b,Hb(this.j,function(b){b.clear()}),this.u())};l.yb=function(b,c){var d=Ee(b);d&&(d=w(d).toString(),d in this.o||(this.o[d]=c))};
function Lz(b,c){b.Ua().src=c};function Oz(b){Y.call(this,{crossOrigin:"anonymous",opaque:!0,projection:Ee("EPSG:3857"),reprojectionErrorThreshold:b.reprojectionErrorThreshold,state:"loading",tileLoadFunction:b.tileLoadFunction,wrapX:void 0!==b.wrapX?b.wrapX:!0});this.l=void 0!==b.culture?b.culture:"en-us";this.c=void 0!==b.maxZoom?b.maxZoom:-1;var c=new It("https://dev.virtualearth.net/REST/v1/Imagery/Metadata/"+b.imagerySet);Hz(new Fz(c,"jsonp"),{include:"ImageryProviders",uriScheme:"https",key:b.key},this.v.bind(this))}
z(Oz,Y);var Pz=new kg({html:'<a class="ol-attribution-bing-tos" href="http://www.microsoft.com/maps/product/terms.html">Terms of Use</a>'});
Oz.prototype.v=function(b){if(200!=b.statusCode||"OK"!=b.statusDescription||"ValidCredentials"!=b.authenticationResultCode||1!=b.resourceSets.length||1!=b.resourceSets[0].resources.length)wh(this,"error");else{var c=b.brandLogoUri;-1==c.indexOf("https")&&(c=c.replace("http","https"));var d=b.resourceSets[0].resources[0],e=-1==this.c?d.zoomMax:this.c;b=Ih(this.b);var f=Kh({extent:b,minZoom:d.zoomMin,maxZoom:e,tileSize:d.imageWidth==d.imageHeight?d.imageWidth:[d.imageWidth,d.imageHeight]});this.tileGrid=
f;var g=this.l;this.tileUrlFunction=Yp(d.imageUrlSubdomains.map(function(b){var c=[0,0,0],e=d.imageUrl.replace("{subdomain}",b).replace("{culture}",g);return function(b){if(b)return ag(b[0],b[1],-b[2]-1,c),e.replace("{quadkey}",bg(c))}}));if(d.imageryProviders){var h=Ie(Ee("EPSG:4326"),this.b);b=d.imageryProviders.map(function(b){var c=b.attribution,d={};b.coverageAreas.forEach(function(b){var c=b.zoomMin,g=Math.min(b.zoomMax,e);b=b.bbox;b=pe([b[1],b[0],b[3],b[2]],h);var k,m;for(k=c;k<=g;++k)m=k.toString(),
c=Bh(f,b,k),m in d?d[m].push(c):d[m]=[c]});return new kg({html:c,tileRanges:d})});b.push(Pz);this.oa(b)}this.U=c;wh(this,"ready")}};function Qz(b){Jp.call(this,{attributions:b.attributions,extent:b.extent,logo:b.logo,projection:b.projection,wrapX:b.wrapX});this.D=void 0;this.ha=void 0!==b.distance?b.distance:20;this.C=[];this.v=b.source;this.v.H("change",Qz.prototype.qa,this)}z(Qz,Jp);Qz.prototype.ia=function(){return this.v};Qz.prototype.Oc=function(b,c,d){this.v.Oc(b,c,d);c!==this.D&&(this.clear(),this.D=c,Rz(this),this.Ic(this.C))};Qz.prototype.qa=function(){this.clear();Rz(this);this.Ic(this.C);this.u()};
function Rz(b){if(void 0!==b.D){b.C.length=0;for(var c=Ld(),d=b.ha*b.D,e=b.v.Be(),f={},g=0,h=e.length;g<h;g++){var k=e[g];w(k).toString()in f||(k=k.W().Z(),Wd(k,c),Pd(c,d,c),k=b.v.pf(c),k=k.filter(function(b){b=w(b).toString();return b in f?!1:f[b]=!0}),b.C.push(Sz(k)))}}}function Sz(b){for(var c=b.length,d=[0,0],e=0;e<c;e++){var f=b[e].W().Z();od(d,f)}c=1/c;d[0]*=c;d[1]*=c;d=new un(new F(d));d.set("features",b);return d};function Tz(b){mn.call(this,{projection:b.projection,resolutions:b.resolutions});this.ha=void 0!==b.crossOrigin?b.crossOrigin:null;this.o=void 0!==b.displayDpi?b.displayDpi:96;this.j=void 0!==b.params?b.params:{};this.Y=b.url;this.c=void 0!==b.imageLoadFunction?b.imageLoadFunction:sn;this.ia=void 0!==b.hidpi?b.hidpi:!0;this.na=void 0!==b.metersPerUnit?b.metersPerUnit:1;this.v=void 0!==b.ratio?b.ratio:1;this.xa=void 0!==b.useOverlay?b.useOverlay:!1;this.g=null;this.T=0}z(Tz,mn);l=Tz.prototype;
l.Pm=function(){return this.j};
l.sd=function(b,c,d){c=nn(this,c);d=this.ia?d:1;var e=this.g;if(e&&this.T==this.f&&e.$()==c&&e.b==d&&Ud(e.J(),b))return e;1!=this.v&&(b=b.slice(),oe(b,this.v));var f=[ie(b)/c*d,je(b)/c*d];if(void 0!==this.Y){var e=this.Y,g=ke(b),h=this.na,k=ie(b),m=je(b),n=f[0],p=f[1],q=.0254/this.o,f={OPERATION:this.xa?"GETDYNAMICMAPOVERLAYIMAGE":"GETMAPIMAGE",VERSION:"2.0.0",LOCALE:"en",CLIENTAGENT:"ol.source.ImageMapGuide source",CLIP:"1",SETDISPLAYDPI:this.o,SETDISPLAYWIDTH:Math.round(f[0]),SETDISPLAYHEIGHT:Math.round(f[1]),
SETVIEWSCALE:p*k>n*m?k*h/(n*q):m*h/(p*q),SETVIEWCENTERX:g[0],SETVIEWCENTERY:g[1]};Ub(f,this.j);e=mo(oo([e],f));e=new by(b,c,d,this.i,e,this.ha,this.c);D(e,"change",this.l,!1,this)}else e=null;this.g=e;this.T=this.f;return e};l.Om=function(){return this.c};l.Rm=function(b){Ub(this.j,b);this.u()};l.Qm=function(b){this.g=null;this.c=b;this.u()};function Uz(b){var c=void 0!==b.attributions?b.attributions:null,d=b.imageExtent,e=void 0!==b.crossOrigin?b.crossOrigin:null,f=void 0!==b.imageLoadFunction?b.imageLoadFunction:sn;mn.call(this,{attributions:c,logo:b.logo,projection:Ee(b.projection)});this.c=new by(d,void 0,1,c,b.url,e,f);this.g=b.imageSize?b.imageSize:null;D(this.c,"change",this.l,!1,this)}z(Uz,mn);Uz.prototype.sd=function(b){return ne(b,this.c.J())?this.c:null};
Uz.prototype.l=function(b){if(2==this.c.state){var c=this.c.J(),d=this.c.a(),e,f;this.g?(e=this.g[0],f=this.g[1]):(e=d.width,f=d.height);c=Math.ceil(ie(c)/(je(c)/f));if(c!=e){var g=document.createElement("canvas");g.width=c;g.height=f;g.getContext("2d").drawImage(d,0,0,e,f,0,0,g.width,g.height);this.c.f=g}}Uz.da.l.call(this,b)};function Vz(b){b=b||{};mn.call(this,{attributions:b.attributions,logo:b.logo,projection:b.projection,resolutions:b.resolutions});this.na=void 0!==b.crossOrigin?b.crossOrigin:null;this.j=b.url;this.T=void 0!==b.imageLoadFunction?b.imageLoadFunction:sn;this.g=b.params;this.v=!0;Wz(this);this.ia=b.serverType;this.xa=void 0!==b.hidpi?b.hidpi:!0;this.c=null;this.Y=[0,0];this.ha=0;this.o=void 0!==b.ratio?b.ratio:1.5}z(Vz,mn);var Xz=[101,101];l=Vz.prototype;
l.Xm=function(b,c,d,e){if(void 0!==this.j){var f=le(b,c,0,Xz),g={SERVICE:"WMS",VERSION:"1.3.0",REQUEST:"GetFeatureInfo",FORMAT:"image/png",TRANSPARENT:!0,QUERY_LAYERS:this.g.LAYERS};Ub(g,this.g,e);e=Math.floor((f[3]-b[1])/c);g[this.v?"I":"X"]=Math.floor((b[0]-f[0])/c);g[this.v?"J":"Y"]=e;return Yz(this,f,Xz,1,Ee(d),g)}};l.Zm=function(){return this.g};
l.sd=function(b,c,d,e){if(void 0===this.j)return null;c=nn(this,c);1==d||this.xa&&void 0!==this.ia||(d=1);b=b.slice();var f=(b[0]+b[2])/2,g=(b[1]+b[3])/2,h=c/d,k=ie(b)/h,h=je(b)/h,m=this.c;if(m&&this.ha==this.f&&m.$()==c&&m.b==d&&Ud(m.J(),b))return m;if(1!=this.o){var m=this.o*ie(b)/2,n=this.o*je(b)/2;b[0]=f-m;b[1]=g-n;b[2]=f+m;b[3]=g+n}f={SERVICE:"WMS",VERSION:"1.3.0",REQUEST:"GetMap",FORMAT:"image/png",TRANSPARENT:!0};Ub(f,this.g);this.Y[0]=Math.ceil(k*this.o);this.Y[1]=Math.ceil(h*this.o);e=Yz(this,
b,this.Y,d,e,f);this.c=new by(b,c,d,this.i,e,this.na,this.T);this.ha=this.f;D(this.c,"change",this.l,!1,this);return this.c};l.Ym=function(){return this.T};
function Yz(b,c,d,e,f,g){g[b.v?"CRS":"SRS"]=f.Ya;"STYLES"in b.g||(g.STYLES=new String(""));if(1!=e)switch(b.ia){case "geoserver":e=90*e+.5|0;g.FORMAT_OPTIONS="FORMAT_OPTIONS"in g?g.FORMAT_OPTIONS+(";dpi:"+e):"dpi:"+e;break;case "mapserver":g.MAP_RESOLUTION=90*e;break;case "carmentaserver":case "qgis":g.DPI=90*e}g.WIDTH=d[0];g.HEIGHT=d[1];d=f.c;var h;b.v&&"ne"==d.substr(0,2)?h=[c[1],c[0],c[3],c[2]]:h=c;g.BBOX=h.join(",");return mo(oo([b.j],g))}l.$m=function(){return this.j};
l.an=function(b){this.c=null;this.T=b;this.u()};l.bn=function(b){b!=this.j&&(this.j=b,this.c=null,this.u())};l.cn=function(b){Ub(this.g,b);Wz(this);this.c=null;this.u()};function Wz(b){b.v=0<=Pa(Pb(b.g,"VERSION","1.3.0"),"1.3")};function Zz(b){var c=void 0!==b.projection?b.projection:"EPSG:3857",d=void 0!==b.tileGrid?b.tileGrid:Kh({extent:Ih(c),maxZoom:b.maxZoom,tileSize:b.tileSize});Y.call(this,{attributions:b.attributions,crossOrigin:b.crossOrigin,logo:b.logo,opaque:b.opaque,projection:c,reprojectionErrorThreshold:b.reprojectionErrorThreshold,tileGrid:d,tileLoadFunction:b.tileLoadFunction,tilePixelRatio:b.tilePixelRatio,tileUrlFunction:b.tileUrlFunction,url:b.url,urls:b.urls,wrapX:void 0!==b.wrapX?b.wrapX:!0})}z(Zz,Y);function $z(b){b=b||{};var c;void 0!==b.attributions?c=b.attributions:c=[aA];Zz.call(this,{attributions:c,crossOrigin:void 0!==b.crossOrigin?b.crossOrigin:"anonymous",opaque:!0,maxZoom:void 0!==b.maxZoom?b.maxZoom:19,reprojectionErrorThreshold:b.reprojectionErrorThreshold,tileLoadFunction:b.tileLoadFunction,url:void 0!==b.url?b.url:"https://{a-c}.tile.openstreetmap.org/{z}/{x}/{y}.png",wrapX:b.wrapX})}z($z,Zz);var aA=new kg({html:'&copy; <a href="http://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors.'});function bA(b){b=b||{};var c=cA[b.layer];this.c=b.layer;Zz.call(this,{attributions:c.attributions,crossOrigin:"anonymous",logo:"https://developer.mapquest.com/content/osm/mq_logo.png",maxZoom:c.maxZoom,reprojectionErrorThreshold:b.reprojectionErrorThreshold,opaque:c.opaque,tileLoadFunction:b.tileLoadFunction,url:void 0!==b.url?b.url:"https://otile{1-4}-s.mqcdn.com/tiles/1.0.0/"+this.c+"/{z}/{x}/{y}.jpg"})}z(bA,Zz);
var dA=new kg({html:'Tiles Courtesy of <a href="http://www.mapquest.com/">MapQuest</a>'}),cA={osm:{maxZoom:19,opaque:!0,attributions:[dA,aA]},sat:{maxZoom:18,opaque:!0,attributions:[dA,new kg({html:"Portions Courtesy NASA/JPL-Caltech and U.S. Depart. of Agriculture, Farm Service Agency"})]},hyb:{maxZoom:18,opaque:!1,attributions:[dA,aA]}};bA.prototype.l=function(){return this.c};(function(){var b={},c={ka:b};(function(d){if("object"===typeof b&&"undefined"!==typeof c)c.ka=d();else{var e;"undefined"!==typeof window?e=window:"undefined"!==typeof global?e=global:"undefined"!==typeof self?e=self:e=this;e.Jp=d()}})(function(){return function e(b,c,h){function k(n,q){if(!c[n]){if(!b[n]){var r="function"==typeof require&&require;if(!q&&r)return r(n,!0);if(m)return m(n,!0);r=Error("Cannot find module '"+n+"'");throw r.code="MODULE_NOT_FOUND",r;}r=c[n]={ka:{}};b[n][0].call(r.ka,function(c){var e=
b[n][1][c];return k(e?e:c)},r,r.ka,e,b,c,h)}return c[n].ka}for(var m="function"==typeof require&&require,n=0;n<h.length;n++)k(h[n]);return k}({1:[function(b,c,g){b=b("./processor");g.Xi=b},{"./processor":2}],2:[function(b,c){function g(b){return function(c){var e=c.buffers,f=c.meta,g=c.width,h=c.height,k=e.length,m=e[0].byteLength,A;if(c.imageOps){m=Array(k);for(A=0;A<k;++A)m[A]=new ImageData(new Uint8ClampedArray(e[A]),g,h);g=b(m,f).data}else{g=new Uint8ClampedArray(m);h=Array(k);c=Array(k);for(A=
0;A<k;++A)h[A]=new Uint8ClampedArray(e[A]),c[A]=[0,0,0,0];for(e=0;e<m;e+=4){for(A=0;A<k;++A){var y=h[A];c[A][0]=y[e];c[A][1]=y[e+1];c[A][2]=y[e+2];c[A][3]=y[e+3]}A=b(c,f);g[e]=A[0];g[e+1]=A[1];g[e+2]=A[2];g[e+3]=A[3]}}return g.buffer}}function h(b,c){var e=Object.keys(b.lib||{}).map(function(c){return"var "+c+" = "+b.lib[c].toString()+";"}).concat(["var __minion__ = ("+g.toString()+")(",b.operation.toString(),");",'self.addEventListener("message", function(__event__) {',"var buffer = __minion__(__event__.data);",
"self.postMessage({buffer: buffer, meta: __event__.data.meta}, [buffer]);","});"]),e=URL.createObjectURL(new Blob(e,{type:"text/javascript"})),e=new Worker(e);e.addEventListener("message",c);return e}function k(b,c){var e=g(b.operation);return{postMessage:function(b){setTimeout(function(){c({data:{buffer:e(b),se:b.se}})},0)}}}function m(b){this.bf=!!b.kl;var c;0===b.threads?c=0:this.bf?c=1:c=b.threads||1;var e=[];if(c)for(var f=0;f<c;++f)e[f]=h(b,this.mg.bind(this,f));else e[0]=k(b,this.mg.bind(this,
0));this.Ud=e;this.ad=[];this.kj=b.mo||Infinity;this.Sd=0;this.Hc={};this.cf=null}m.prototype.lo=function(b,c,e){this.hj({xc:b,se:c,cd:e});this.jg()};m.prototype.hj=function(b){for(this.ad.push(b);this.ad.length>this.kj;)this.ad.shift().cd(null,null)};m.prototype.jg=function(){if(0===this.Sd&&0<this.ad.length){var b=this.cf=this.ad.shift(),c=b.xc[0].width,e=b.xc[0].height,f=b.xc.map(function(b){return b.data.buffer}),g=this.Ud.length;this.Sd=g;if(1===g)this.Ud[0].postMessage({buffers:f,meta:b.se,
imageOps:this.bf,width:c,height:e},f);else for(var h=4*Math.ceil(b.xc[0].data.length/4/g),k=0;k<g;++k){for(var m=k*h,A=[],y=0,B=f.length;y<B;++y)A.push(f[k].slice(m,m+h));this.Ud[k].postMessage({buffers:A,meta:b.se,imageOps:this.bf,width:c,height:e},A)}}};m.prototype.mg=function(b,c){this.Fp||(this.Hc[b]=c.data,--this.Sd,0===this.Sd&&this.lj())};m.prototype.lj=function(){var b=this.cf,c=this.Ud.length,e,f;if(1===c)e=new Uint8ClampedArray(this.Hc[0].buffer),f=this.Hc[0].meta;else{var g=b.xc[0].data.length;
e=new Uint8ClampedArray(g);f=Array(g);for(var g=4*Math.ceil(g/4/c),h=0;h<c;++h){var k=h*g;e.set(new Uint8ClampedArray(this.Hc[h].buffer),k);f[h]=this.Hc[h].meta}}this.cf=null;this.Hc={};b.cd(null,new ImageData(e,b.xc[0].width,b.xc[0].height),f);this.jg()};c.ka=m},{}]},{},[1])(1)});Cp=c.ka})();function eA(b){this.T=null;this.xa=void 0!==b.operationType?b.operationType:"pixel";this.jb=void 0!==b.threads?b.threads:1;this.c=fA(b.sources);for(var c=0,d=this.c.length;c<d;++c)D(this.c[c],"change",this.u,!1,this);this.g=Mi();this.ia=new Gk(function(){return 1},this.u.bind(this));for(var c=gA(this.c),d={},e=0,f=c.length;e<f;++e)d[w(c[e].layer)]=c[e];this.j=this.o=null;this.ha={animate:!1,attributions:{},coordinateToPixelMatrix:Ad(),extent:null,focus:null,index:0,layerStates:d,layerStatesArray:c,
logos:{},pixelRatio:1,pixelToCoordinateMatrix:Ad(),postRenderFunctions:[],size:[0,0],skippedFeatureUids:{},tileQueue:this.ia,time:Date.now(),usedTiles:{},viewState:{rotation:0},viewHints:[],wantedTiles:{}};mn.call(this,{});void 0!==b.operation&&this.v(b.operation,b.lib)}z(eA,mn);eA.prototype.v=function(b,c){this.T=new Cp.Xi({operation:b,kl:"image"===this.xa,mo:1,lib:c,threads:this.jb});this.u()};function hA(b,c,d){var e=b.o;return!e||b.f!==e.Po||d!==e.resolution||!$d(c,e.extent)}
eA.prototype.C=function(b,c,d,e){d=!0;for(var f,g=0,h=this.c.length;g<h;++g)if(f=this.c[g].a.ea(),"ready"!==f.B){d=!1;break}if(!d)return null;if(!hA(this,b,c))return this.j;d=this.g.canvas;f=Math.round(ie(b)/c);g=Math.round(je(b)/c);if(f!==d.width||g!==d.height)d.width=f,d.height=g;f=Rb(this.ha);f.viewState=Rb(f.viewState);var g=ke(b),h=Math.round(ie(b)/c),k=Math.round(je(b)/c);f.extent=b;f.focus=ke(b);f.size[0]=h;f.size[1]=k;h=f.viewState;h.center=g;h.projection=e;h.resolution=c;this.j=e=new bn(b,
c,1,this.i,d,this.Y.bind(this,f));this.o={extent:b,resolution:c,Po:this.f};return e};
eA.prototype.Y=function(b,c){for(var d=this.c.length,e=Array(d),f=0;f<d;++f){var g;var h=this.c[f],k=b;h.Cd(k,b.layerStatesArray[f]);if(g=h.Bd()){var h=h.qf(),m=Math.round(h[12]),n=Math.round(h[13]),p=k.size[0],k=k.size[1];if(g instanceof Image){if(iA){var q=iA.canvas;q.width!==p||q.height!==k?iA=Mi(p,k):iA.clearRect(0,0,p,k)}else iA=Mi(p,k);iA.drawImage(g,m,n,Math.round(g.width*h[0]),Math.round(g.height*h[5]));g=iA.getImageData(0,0,p,k)}else g=g.getContext("2d").getImageData(-m,-n,p,k)}else g=null;
if(g)e[f]=g;else return}d={};this.s(new jA(kA,b,d));this.T.lo(e,d,this.na.bind(this,b,c));Hk(b.tileQueue,16,16)};eA.prototype.na=function(b,c,d,e,f){d?c(d):e&&(this.s(new jA(lA,b,f)),hA(this,b.extent,b.viewState.resolution/b.pixelRatio)||this.g.putImageData(e,0,0),c(null))};var iA=null;function gA(b){return b.map(function(b){return Yj(b.a)})}
function fA(b){for(var c=b.length,d=Array(c),e=0;e<c;++e){var f=e,g=b[e],h=null;g instanceof Lh?(g=new H({source:g}),h=new Up(g)):g instanceof mn&&(g=new Rl({source:g}),h=new Tp(g));d[f]=h}return d}function jA(b,c,d){rc.call(this,b);this.extent=c.extent;this.resolution=c.viewState.resolution/c.pixelRatio;this.data=d}z(jA,rc);var kA="beforeoperations",lA="afteroperations";var mA={terrain:{qb:"jpg",opaque:!0},"terrain-background":{qb:"jpg",opaque:!0},"terrain-labels":{qb:"png",opaque:!1},"terrain-lines":{qb:"png",opaque:!1},"toner-background":{qb:"png",opaque:!0},toner:{qb:"png",opaque:!0},"toner-hybrid":{qb:"png",opaque:!1},"toner-labels":{qb:"png",opaque:!1},"toner-lines":{qb:"png",opaque:!1},"toner-lite":{qb:"png",opaque:!0},watercolor:{qb:"jpg",opaque:!0}},nA={terrain:{minZoom:4,maxZoom:18},toner:{minZoom:0,maxZoom:20},watercolor:{minZoom:3,maxZoom:16}};
function oA(b){var c=b.layer.indexOf("-"),c=-1==c?b.layer:b.layer.slice(0,c),d=mA[b.layer];Zz.call(this,{attributions:pA,crossOrigin:"anonymous",maxZoom:nA[c].maxZoom,opaque:d.opaque,reprojectionErrorThreshold:b.reprojectionErrorThreshold,tileLoadFunction:b.tileLoadFunction,url:void 0!==b.url?b.url:"https://stamen-tiles-{a-d}.a.ssl.fastly.net/"+b.layer+"/{z}/{x}/{y}."+d.qb})}z(oA,Zz);
var pA=[new kg({html:'Map tiles by <a href="http://stamen.com/">Stamen Design</a>, under <a href="http://creativecommons.org/licenses/by/3.0/">CC BY 3.0</a>.'}),aA];function qA(b){b=b||{};var c=void 0!==b.params?b.params:{};Y.call(this,{attributions:b.attributions,crossOrigin:b.crossOrigin,logo:b.logo,projection:b.projection,reprojectionErrorThreshold:b.reprojectionErrorThreshold,tileGrid:b.tileGrid,tileLoadFunction:b.tileLoadFunction,url:b.url,urls:b.urls,wrapX:void 0!==b.wrapX?b.wrapX:!0});this.c=c;this.l=Ld()}z(qA,Y);qA.prototype.v=function(){return this.c};qA.prototype.vc=function(b){return b};
qA.prototype.ae=function(b,c,d){var e=this.tileGrid;e||(e=this.kb(d));if(!(e.a.length<=b[0])){var f=e.Ba(b,this.l),g=ld(e.Ma(b[0]),this.g);1!=c&&(g=kd(g,c,this.g));e={F:"image",FORMAT:"PNG32",TRANSPARENT:!0};Ub(e,this.c);var h=this.urls;h?(d=d.Ya.split(":").pop(),e.SIZE=g[0]+","+g[1],e.BBOX=f.join(","),e.BBOXSR=d,e.IMAGESR=d,e.DPI=Math.round(e.DPI?e.DPI*c:90*c),b=1==h.length?h[0]:h[md((b[1]<<b[0])+b[2],h.length)],Ba(b,"/")||(b+="/"),Ba(b,"MapServer/")?b+="export":Ba(b,"ImageServer/")&&(b+="exportImage"),
b=mo(oo([b],e))):b=void 0;return b}};qA.prototype.C=function(b){Ub(this.c,b);this.u()};function rA(b,c,d){sh.call(this,b,2);this.g=c;this.b=d;this.f={}}z(rA,sh);rA.prototype.Ua=function(b){b=void 0!==b?w(b):-1;if(b in this.f)return this.f[b];var c=this.g,d=Mi(c[0],c[1]);d.strokeStyle="black";d.strokeRect(.5,.5,c[0]+.5,c[1]+.5);d.fillStyle="black";d.textAlign="center";d.textBaseline="middle";d.font="24px sans-serif";d.fillText(this.b,c[0]/2,c[1]/2);return this.f[b]=d.canvas};
function sA(b){Lh.call(this,{opaque:!1,projection:b.projection,tileGrid:b.tileGrid,wrapX:void 0!==b.wrapX?b.wrapX:!0})}z(sA,Lh);sA.prototype.Qb=function(b,c,d){var e=this.Cb(b,c,d);if(oh(this.a,e))return this.a.get(e);var f=ld(this.tileGrid.Ma(b));b=[b,c,d];c=(c=Oh(this,b))?Oh(this,c).toString():"";f=new rA(b,f,c);this.a.set(e,f);return f};function tA(){}z(tA,fo);tA.prototype.a=function(){var b=new XMLHttpRequest;if("withCredentials"in b)return b;if("undefined"!=typeof XDomainRequest)return new uA;throw Error("Unsupported browser");};tA.prototype.c=function(){return{}};
function uA(){this.a=new XDomainRequest;this.readyState=0;this.responseText=this.onreadystatechange=null;this.status=-1;this.statusText=this.responseXML=null;this.a.onload=ta(this.Bk,this);this.a.onerror=ta(this.Ng,this);this.a.onprogress=ta(this.al,this);this.a.ontimeout=ta(this.gl,this)}l=uA.prototype;l.open=function(b,c,d){if(null!=d&&!d)throw Error("Only async requests are supported.");this.a.open(b,c)};
l.send=function(b){if(b)if("string"==typeof b)this.a.send(b);else throw Error("Only string data is supported");else this.a.send()};l.abort=function(){this.a.abort()};l.setRequestHeader=function(){};l.getResponseHeader=function(b){return"content-type"==b.toLowerCase()?this.a.contentType:""};l.Bk=function(){this.status=200;this.responseText=this.a.responseText;vA(this,4)};l.Ng=function(){this.status=500;this.responseText=null;vA(this,4)};l.gl=function(){this.Ng()};
l.al=function(){this.status=200;vA(this,1)};function vA(b,c){b.readyState=c;if(b.onreadystatechange)b.onreadystatechange()}l.getAllResponseHeaders=function(){return"content-type: "+this.a.contentType};function wA(b){Y.call(this,{attributions:b.attributions,crossOrigin:b.crossOrigin,projection:Ee("EPSG:3857"),reprojectionErrorThreshold:b.reprojectionErrorThreshold,state:"loading",tileLoadFunction:b.tileLoadFunction,wrapX:void 0!==b.wrapX?b.wrapX:!0});if(b.jsonp)Hz(new Fz(b.url),void 0,this.l.bind(this),this.c.bind(this));else{var c=new po(new tA);D(c,"complete",function(){if(Do(c)){var b;b=c.fa?co(c.fa.responseText):void 0;this.l(b)}else this.c();c.rc()},!1,this);to(c,b.url)}}z(wA,Y);
wA.prototype.l=function(b){var c=Ee("EPSG:4326"),d=this.b,e;void 0!==b.bounds&&(e=pe(b.bounds,Ie(c,d)));var f=b.minzoom||0,g=b.maxzoom||22;this.tileGrid=d=Kh({extent:Ih(d),maxZoom:g,minZoom:f});this.tileUrlFunction=Xp(b.tiles,d);if(void 0!==b.attribution&&!this.i){c=void 0!==e?e:c.J();e={};for(var h;f<=g;++f)h=f.toString(),e[h]=[Bh(d,c,f)];this.oa([new kg({html:b.attribution,tileRanges:e})])}wh(this,"ready")};wA.prototype.c=function(){wh(this,"error")};function xA(b){Lh.call(this,{projection:Ee("EPSG:3857"),state:"loading"});this.l=void 0!==b.preemptive?b.preemptive:!0;this.j=Zp;this.c=void 0;Hz(new Fz(b.url),void 0,this.fn.bind(this))}z(xA,Lh);l=xA.prototype;l.tk=function(){return this.c};l.Fj=function(b,c,d,e,f){this.tileGrid?(c=this.tileGrid.he(b,c),yA(this.Qb(c[0],c[1],c[2],1,this.b),b,d,e,f)):!0===f?ki(function(){d.call(e,null)}):d.call(e,null)};
l.fn=function(b){var c=Ee("EPSG:4326"),d=this.b,e;void 0!==b.bounds&&(e=pe(b.bounds,Ie(c,d)));var f=b.minzoom||0,g=b.maxzoom||22;this.tileGrid=d=Kh({extent:Ih(d),maxZoom:g,minZoom:f});this.c=b.template;var h=b.grids;if(h){this.j=Xp(h,d);if(void 0!==b.attribution){c=void 0!==e?e:c.J();for(e={};f<=g;++f)h=f.toString(),e[h]=[Bh(d,c,f)];this.oa([new kg({html:b.attribution,tileRanges:e})])}wh(this,"ready")}else wh(this,"error")};
l.Qb=function(b,c,d,e,f){var g=this.Cb(b,c,d);if(oh(this.a,g))return this.a.get(g);b=[b,c,d];c=Oh(this,b,f);e=this.j(c,e,f);e=new zA(b,void 0!==e?0:4,void 0!==e?e:"",this.tileGrid.Ba(b),this.l);this.a.set(g,e);return e};l.bg=function(b,c,d){b=this.Cb(b,c,d);oh(this.a,b)&&this.a.get(b)};function zA(b,c,d,e,f){sh.call(this,b,c);this.j=d;this.f=e;this.l=f;this.i=this.g=this.b=null}z(zA,sh);l=zA.prototype;l.Ua=function(){return null};
function AA(b,c){if(!b.b||!b.g||!b.i)return null;var d=b.b[Math.floor((1-(c[1]-b.f[1])/(b.f[3]-b.f[1]))*b.b.length)];if(!la(d))return null;d=d.charCodeAt(Math.floor((c[0]-b.f[0])/(b.f[2]-b.f[0])*d.length));93<=d&&d--;35<=d&&d--;d-=32;return d in b.g?b.i[b.g[d]]:null}function yA(b,c,d,e,f){0==b.state&&!0===f?(Uc(b,"change",function(){d.call(e,AA(this,c))},!1,b),BA(b)):!0===f?ki(function(){d.call(e,AA(this,c))},b):d.call(e,AA(b,c))}l.bb=function(){return this.j};l.dn=function(){this.state=3;th(this)};
l.en=function(b){this.b=b.grid;this.g=b.keys;this.i=b.data;this.state=4;th(this)};function BA(b){0==b.state&&(b.state=1,Hz(new Fz(b.j),void 0,b.en.bind(b),b.dn.bind(b)))}l.load=function(){this.l&&BA(this)};function CA(b){b=b||{};var c=void 0!==b.params?b.params:{};Y.call(this,{attributions:b.attributions,crossOrigin:b.crossOrigin,logo:b.logo,opaque:!Pb(c,"TRANSPARENT",!0),projection:b.projection,reprojectionErrorThreshold:b.reprojectionErrorThreshold,tileGrid:b.tileGrid,tileLoadFunction:b.tileLoadFunction,url:b.url,urls:b.urls,wrapX:void 0!==b.wrapX?b.wrapX:!0});this.v=void 0!==b.gutter?b.gutter:0;this.c=c;this.ia="";DA(this);this.l=!0;this.C=b.serverType;this.Y=void 0!==b.hidpi?b.hidpi:!0;this.T="";
EA(this);this.ha=Ld();FA(this)}z(CA,Y);l=CA.prototype;
l.gn=function(b,c,d,e){d=Ee(d);var f=this.tileGrid;f||(f=this.kb(d));c=f.he(b,c);if(!(f.a.length<=c[0])){var g=f.$(c[0]),h=f.Ba(c,this.ha),f=ld(f.Ma(c[0]),this.g),k=this.v;0!==k&&(f=jd(f,k,this.g),h=Pd(h,g*k,h));k={SERVICE:"WMS",VERSION:"1.3.0",REQUEST:"GetFeatureInfo",FORMAT:"image/png",TRANSPARENT:!0,QUERY_LAYERS:this.c.LAYERS};Ub(k,this.c,e);e=Math.floor((h[3]-b[1])/g);k[this.l?"I":"X"]=Math.floor((b[0]-h[0])/g);k[this.l?"J":"Y"]=e;return GA(this,c,f,h,1,d,k)}};l.ce=function(){return this.v};
l.rf=function(){return this.ia};l.Cb=function(b,c,d){return this.T+CA.da.Cb.call(this,b,c,d)};l.hn=function(){return this.c};
function GA(b,c,d,e,f,g,h){var k=b.urls;if(k){h.WIDTH=d[0];h.HEIGHT=d[1];h[b.l?"CRS":"SRS"]=g.Ya;"STYLES"in b.c||(h.STYLES=new String(""));if(1!=f)switch(b.C){case "geoserver":d=90*f+.5|0;h.FORMAT_OPTIONS="FORMAT_OPTIONS"in h?h.FORMAT_OPTIONS+(";dpi:"+d):"dpi:"+d;break;case "mapserver":h.MAP_RESOLUTION=90*f;break;case "carmentaserver":case "qgis":h.DPI=90*f}g=g.c;b.l&&"ne"==g.substr(0,2)&&(b=e[0],e[0]=e[1],e[1]=b,b=e[2],e[2]=e[3],e[3]=b);h.BBOX=e.join(",");return mo(oo([1==k.length?k[0]:k[md((c[1]<<
c[0])+c[2],k.length)]],h))}}l.vc=function(b){return this.Y&&void 0!==this.C?b:1};function EA(b){var c=0,d=[];if(b.urls){var e,f;e=0;for(f=b.urls.length;e<f;++e)d[c++]=b.urls[e]}b.T=d.join("#")}function DA(b){var c=0,d=[],e;for(e in b.c)d[c++]=e+"-"+b.c[e];b.ia=d.join("/")}
l.ae=function(b,c,d){var e=this.tileGrid;e||(e=this.kb(d));if(!(e.a.length<=b[0])){1==c||this.Y&&void 0!==this.C||(c=1);var f=e.$(b[0]),g=e.Ba(b,this.ha),e=ld(e.Ma(b[0]),this.g),h=this.v;0!==h&&(e=jd(e,h,this.g),g=Pd(g,f*h,g));1!=c&&(e=kd(e,c,this.g));f={SERVICE:"WMS",VERSION:"1.3.0",REQUEST:"GetMap",FORMAT:"image/png",TRANSPARENT:!0};Ub(f,this.c);return GA(this,b,e,g,c,d,f)}};l.jn=function(b){Ub(this.c,b);EA(this);DA(this);FA(this);this.u()};
function FA(b){b.l=0<=Pa(Pb(b.c,"VERSION","1.3.0"),"1.3")};function HA(b){this.j=b.matrixIds;xh.call(this,{extent:b.extent,origin:b.origin,origins:b.origins,resolutions:b.resolutions,tileSize:b.tileSize,tileSizes:b.tileSizes,sizes:b.sizes})}z(HA,xh);HA.prototype.o=function(){return this.j};
function IA(b,c){var d=[],e=[],f=[],g=[],h=[],k;k=Ee(b.SupportedCRS.replace(/urn:ogc:def:crs:(\w+):(.*:)?(\w+)$/,"$1:$3"));var m=k.$b(),n="ne"==k.c.substr(0,2);b.TileMatrix.sort(function(b,c){return c.ScaleDenominator-b.ScaleDenominator});b.TileMatrix.forEach(function(b){e.push(b.Identifier);var c=2.8E-4*b.ScaleDenominator/m,k=b.TileWidth,t=b.TileHeight;n?f.push([b.TopLeftCorner[1],b.TopLeftCorner[0]]):f.push(b.TopLeftCorner);d.push(c);g.push(k==t?k:[k,t]);h.push([b.MatrixWidth,-b.MatrixHeight])});
return new HA({extent:c,origins:f,resolutions:d,matrixIds:e,tileSizes:g,sizes:h})};function Z(b){function c(b){b="KVP"==e?mo(oo([b],g)):b.replace(/\{(\w+?)\}/g,function(b,c){return c.toLowerCase()in g?g[c.toLowerCase()]:b});return function(c){if(c){var d={TileMatrix:f.j[c[0]],TileCol:c[1],TileRow:-c[2]-1};Ub(d,h);c=b;return c="KVP"==e?mo(oo([c],d)):c.replace(/\{(\w+?)\}/g,function(b,c){return d[c]})}}}this.ha=void 0!==b.version?b.version:"1.0.0";this.C=void 0!==b.format?b.format:"image/jpeg";this.c=void 0!==b.dimensions?b.dimensions:{};this.l="";JA(this);this.T=b.layer;this.v=b.matrixSet;
this.Y=b.style;var d=b.urls;void 0===d&&void 0!==b.url&&(d=$p(b.url));var e=this.ia=void 0!==b.requestEncoding?b.requestEncoding:"KVP",f=b.tileGrid,g={layer:this.T,style:this.Y,tilematrixset:this.v};"KVP"==e&&Ub(g,{Service:"WMTS",Request:"GetTile",Version:this.ha,Format:this.C});var h=this.c,k=d&&0<d.length?Yp(d.map(c)):Zp;Y.call(this,{attributions:b.attributions,crossOrigin:b.crossOrigin,logo:b.logo,projection:b.projection,reprojectionErrorThreshold:b.reprojectionErrorThreshold,tileClass:b.tileClass,
tileGrid:f,tileLoadFunction:b.tileLoadFunction,tilePixelRatio:b.tilePixelRatio,tileUrlFunction:k,urls:d,wrapX:void 0!==b.wrapX?b.wrapX:!1})}z(Z,Y);l=Z.prototype;l.Rj=function(){return this.c};l.kn=function(){return this.C};l.rf=function(){return this.l};l.ln=function(){return this.T};l.dk=function(){return this.v};l.rk=function(){return this.ia};l.mn=function(){return this.Y};l.xk=function(){return this.ha};function JA(b){var c=0,d=[],e;for(e in b.c)d[c++]=e+"-"+b.c[e];b.l=d.join("/")}
l.lp=function(b){Ub(this.c,b);JA(this);this.u()};function KA(b){b=b||{};var c=b.size,d=c[0],e=c[1],f=[],g=256;switch(void 0!==b.tierSizeCalculation?b.tierSizeCalculation:"default"){case "default":for(;d>g||e>g;)f.push([Math.ceil(d/g),Math.ceil(e/g)]),g+=g;break;case "truncated":for(;d>g||e>g;)f.push([Math.ceil(d/g),Math.ceil(e/g)]),d>>=1,e>>=1}f.push([1,1]);f.reverse();for(var g=[1],h=[0],e=1,d=f.length;e<d;e++)g.push(1<<e),h.push(f[e-1][0]*f[e-1][1]+h[e-1]);g.reverse();var c=[0,-c[1],c[0],0],c=new xh({extent:c,origin:fe(c),resolutions:g}),k=b.url;
Y.call(this,{attributions:b.attributions,crossOrigin:b.crossOrigin,logo:b.logo,reprojectionErrorThreshold:b.reprojectionErrorThreshold,tileClass:LA,tileGrid:c,tileUrlFunction:function(b){if(b){var c=b[0],d=b[1];b=-b[2]-1;return k+"TileGroup"+((d+b*f[c][0]+h[c])/256|0)+"/"+c+"-"+d+"-"+b+".jpg"}}})}z(KA,Y);function LA(b,c,d,e,f){cy.call(this,b,c,d,e,f);this.g={}}z(LA,cy);
LA.prototype.Ua=function(b){var c=void 0!==b?w(b).toString():"";if(c in this.g)return this.g[c];b=LA.da.Ua.call(this,b);if(2==this.state){if(256==b.width&&256==b.height)return this.g[c]=b;var d=Mi(256,256);d.drawImage(b,0,0);return this.g[c]=d.canvas}return b};function dm(b,c,d,e,f,g){if(d+b.a>b.b||e+b.a>b.b)return null;f=MA(b,!1,c,d,e,f);if(!f)return null;b=MA(b,!0,c,d,e,void 0!==g?g:te);return{offsetX:f.offsetX,offsetY:f.offsetY,image:f.image,Tg:b.image}}
function MA(b,c,d,e,f,g){var h=c?b.i:b.g,k,m,n;m=0;for(n=h.length;m<n;++m){k=h[m];a:{var p=k,q=d,r=e,t=f,v=g,x=void 0,C=void 0;k=void 0;C=0;for(k=p.f.length;C<k;++C)if(x=p.f[C],x.width>=r+p.a&&x.height>=t+p.a){k={offsetX:x.x+p.a,offsetY:x.y+p.a,image:p.b};p.c[q]=k;v.call(void 0,p.g,x.x+p.a,x.y+p.a);q=p;r=r+p.a;p=t+p.a;v=t=void 0;x.width-r>x.height-p?(t={x:x.x+r,y:x.y,width:x.width-r,height:x.height},v={x:x.x,y:x.y+p,width:r,height:x.height-p},NA(q,C,t,v)):(t={x:x.x+r,y:x.y,width:x.width-r,height:p},
v={x:x.x,y:x.y+p,width:x.width,height:x.height-p},NA(q,C,t,v));break a}k=null}if(k)return k;k||m!==n-1||(c?(k=Math.min(2*b.c,b.b),b.c=k):(k=Math.min(2*b.f,b.b),b.f=k),k=new OA(k,b.a),h.push(k),++n)}}function OA(b,c){this.a=c;this.f=[{x:0,y:0,width:b,height:b}];this.c={};this.b=document.createElement("CANVAS");this.b.width=b;this.b.height=b;this.g=this.b.getContext("2d")}OA.prototype.get=function(b){return Pb(this.c,b,null)};
function NA(b,c,d,e){c=[c,1];0<d.width&&0<d.height&&c.push(d);0<e.width&&0<e.height&&c.push(e);b.f.splice.apply(b.f,c)};function PA(b){this.v=this.c=this.g=null;this.o=void 0!==b.fill?b.fill:null;this.wa=[0,0];this.a=b.points;this.b=void 0!==b.radius?b.radius:b.radius1;this.i=void 0!==b.radius2?b.radius2:this.b;this.l=void 0!==b.angle?b.angle:0;this.f=void 0!==b.stroke?b.stroke:null;this.pa=this.U=this.O=null;var c=b.atlasManager,d="",e="",f=0,g=null,h,k=0;this.f&&(h=tg(this.f.a),k=this.f.f,void 0===k&&(k=1),g=this.f.b,Vi||(g=null),e=this.f.g,void 0===e&&(e="round"),d=this.f.c,void 0===d&&(d="round"),f=this.f.i,void 0===
f&&(f=10));var m=2*(this.b+k)+1,d={strokeStyle:h,Jd:k,size:m,lineCap:d,lineDash:g,lineJoin:e,miterLimit:f};if(void 0===c){this.c=document.createElement("CANVAS");this.c.height=m;this.c.width=m;var c=m=this.c.width,n=this.c.getContext("2d");this.Dh(d,n,0,0);this.o?this.v=this.c:(n=this.v=document.createElement("CANVAS"),n.height=d.size,n.width=d.size,n=n.getContext("2d"),this.Ch(d,n,0,0))}else m=Math.round(m),(e=!this.o)&&(n=this.Ch.bind(this,d)),f=this.f?bm(this.f):"-",g=this.o?Wl(this.o):"-",this.g&&
f==this.g[1]&&g==this.g[2]&&this.b==this.g[3]&&this.i==this.g[4]&&this.l==this.g[5]&&this.a==this.g[6]||(this.g=["r"+f+g+(void 0!==this.b?this.b.toString():"-")+(void 0!==this.i?this.i.toString():"-")+(void 0!==this.l?this.l.toString():"-")+(void 0!==this.a?this.a.toString():"-"),f,g,this.b,this.i,this.l,this.a]),n=dm(c,this.g[0],m,m,this.Dh.bind(this,d),n),this.c=n.image,this.wa=[n.offsetX,n.offsetY],c=n.image.width,this.v=e?n.Tg:this.c;this.O=[m/2,m/2];this.U=[m,m];this.pa=[c,c];rk.call(this,{opacity:1,
rotateWithView:!1,rotation:void 0!==b.rotation?b.rotation:0,scale:1,snapToPixel:void 0!==b.snapToPixel?b.snapToPixel:!0})}z(PA,rk);l=PA.prototype;l.Yb=function(){return this.O};l.sn=function(){return this.l};l.tn=function(){return this.o};l.Ce=function(){return this.v};l.hc=function(){return this.c};l.td=function(){return this.pa};l.Ed=function(){return 2};l.Ea=function(){return this.wa};l.vn=function(){return this.a};l.wn=function(){return this.b};l.qk=function(){return this.i};l.Eb=function(){return this.U};
l.xn=function(){return this.f};l.yf=ya;l.load=ya;l.ag=ya;
l.Dh=function(b,c,d,e){var f;c.setTransform(1,0,0,1,0,0);c.translate(d,e);c.beginPath();this.i!==this.b&&(this.a*=2);for(d=0;d<=this.a;d++)e=2*d*Math.PI/this.a-Math.PI/2+this.l,f=0===d%2?this.b:this.i,c.lineTo(b.size/2+f*Math.cos(e),b.size/2+f*Math.sin(e));this.o&&(c.fillStyle=tg(this.o.a),c.fill());this.f&&(c.strokeStyle=b.strokeStyle,c.lineWidth=b.Jd,b.lineDash&&c.setLineDash(b.lineDash),c.lineCap=b.lineCap,c.lineJoin=b.lineJoin,c.miterLimit=b.miterLimit,c.stroke());c.closePath()};
l.Ch=function(b,c,d,e){c.setTransform(1,0,0,1,0,0);c.translate(d,e);c.beginPath();this.i!==this.b&&(this.a*=2);var f;for(d=0;d<=this.a;d++)f=2*d*Math.PI/this.a-Math.PI/2+this.l,e=0===d%2?this.b:this.i,c.lineTo(b.size/2+e*Math.cos(f),b.size/2+e*Math.sin(f));c.fillStyle=Sl;c.fill();this.f&&(c.strokeStyle=b.strokeStyle,c.lineWidth=b.Jd,b.lineDash&&c.setLineDash(b.lineDash),c.stroke());c.closePath()};u("ol.animation.bounce",function(b){var c=b.resolution,d=b.start?b.start:Date.now(),e=void 0!==b.duration?b.duration:1E3,f=b.easing?b.easing:Xf;return function(b,h){if(h.time<d)return h.animate=!0,h.viewHints[0]+=1,!0;if(h.time<d+e){var k=f((h.time-d)/e),m=c-h.viewState.resolution;h.animate=!0;h.viewState.resolution+=k*m;h.viewHints[0]+=1;return!0}return!1}},OPENLAYERS);u("ol.animation.pan",Yf,OPENLAYERS);u("ol.animation.rotate",Zf,OPENLAYERS);u("ol.animation.zoom",$f,OPENLAYERS);
u("ol.Attribution",kg,OPENLAYERS);kg.prototype.getHTML=kg.prototype.b;lg.prototype.element=lg.prototype.element;u("ol.Collection",mg,OPENLAYERS);mg.prototype.clear=mg.prototype.clear;mg.prototype.extend=mg.prototype.zf;mg.prototype.forEach=mg.prototype.forEach;mg.prototype.getArray=mg.prototype.El;mg.prototype.item=mg.prototype.item;mg.prototype.getLength=mg.prototype.bc;mg.prototype.insertAt=mg.prototype.ne;mg.prototype.pop=mg.prototype.pop;mg.prototype.push=mg.prototype.push;
mg.prototype.remove=mg.prototype.remove;mg.prototype.removeAt=mg.prototype.Wf;mg.prototype.setAt=mg.prototype.Ro;u("ol.coordinate.add",od,OPENLAYERS);u("ol.coordinate.createStringXY",function(b){return function(c){return wd(c,b)}},OPENLAYERS);u("ol.coordinate.format",rd,OPENLAYERS);u("ol.coordinate.rotate",td,OPENLAYERS);u("ol.coordinate.toStringHDMS",function(b){return b?qd(b[1],"NS")+" "+qd(b[0],"EW"):""},OPENLAYERS);u("ol.coordinate.toStringXY",wd,OPENLAYERS);u("ol.DeviceOrientation",Rr,OPENLAYERS);
Rr.prototype.getAlpha=Rr.prototype.Lj;Rr.prototype.getBeta=Rr.prototype.Oj;Rr.prototype.getGamma=Rr.prototype.Uj;Rr.prototype.getHeading=Rr.prototype.Fl;Rr.prototype.getTracking=Rr.prototype.$g;Rr.prototype.setTracking=Rr.prototype.Af;u("ol.easing.easeIn",Tf,OPENLAYERS);u("ol.easing.easeOut",Uf,OPENLAYERS);u("ol.easing.inAndOut",Vf,OPENLAYERS);u("ol.easing.linear",Wf,OPENLAYERS);u("ol.easing.upAndDown",Xf,OPENLAYERS);u("ol.extent.boundingExtent",Kd,OPENLAYERS);u("ol.extent.buffer",Pd,OPENLAYERS);
u("ol.extent.containsCoordinate",Sd,OPENLAYERS);u("ol.extent.containsExtent",Ud,OPENLAYERS);u("ol.extent.containsXY",Td,OPENLAYERS);u("ol.extent.createEmpty",Ld,OPENLAYERS);u("ol.extent.equals",$d,OPENLAYERS);u("ol.extent.extend",ae,OPENLAYERS);u("ol.extent.getBottomLeft",ce,OPENLAYERS);u("ol.extent.getBottomRight",de,OPENLAYERS);u("ol.extent.getCenter",ke,OPENLAYERS);u("ol.extent.getHeight",je,OPENLAYERS);u("ol.extent.getIntersection",me,OPENLAYERS);
u("ol.extent.getSize",function(b){return[b[2]-b[0],b[3]-b[1]]},OPENLAYERS);u("ol.extent.getTopLeft",fe,OPENLAYERS);u("ol.extent.getTopRight",ee,OPENLAYERS);u("ol.extent.getWidth",ie,OPENLAYERS);u("ol.extent.intersects",ne,OPENLAYERS);u("ol.extent.isEmpty",he,OPENLAYERS);u("ol.extent.applyTransform",pe,OPENLAYERS);u("ol.Feature",un,OPENLAYERS);un.prototype.clone=un.prototype.clone;un.prototype.getGeometry=un.prototype.W;un.prototype.getId=un.prototype.Qa;un.prototype.getGeometryName=un.prototype.Wj;
un.prototype.getStyle=un.prototype.Hl;un.prototype.getStyleFunction=un.prototype.cc;un.prototype.setGeometry=un.prototype.Oa;un.prototype.setStyle=un.prototype.Bf;un.prototype.setId=un.prototype.kc;un.prototype.setGeometryName=un.prototype.Cc;u("ol.featureloader.tile",wp,OPENLAYERS);u("ol.featureloader.xhr",xp,OPENLAYERS);u("ol.Geolocation",Rx,OPENLAYERS);Rx.prototype.getAccuracy=Rx.prototype.Jj;Rx.prototype.getAccuracyGeometry=Rx.prototype.Kj;Rx.prototype.getAltitude=Rx.prototype.Mj;
Rx.prototype.getAltitudeAccuracy=Rx.prototype.Nj;Rx.prototype.getHeading=Rx.prototype.Jl;Rx.prototype.getPosition=Rx.prototype.Kl;Rx.prototype.getProjection=Rx.prototype.ah;Rx.prototype.getSpeed=Rx.prototype.sk;Rx.prototype.getTracking=Rx.prototype.bh;Rx.prototype.getTrackingOptions=Rx.prototype.Mg;Rx.prototype.setProjection=Rx.prototype.dh;Rx.prototype.setTracking=Rx.prototype.te;Rx.prototype.setTrackingOptions=Rx.prototype.oi;u("ol.Graticule",Xx,OPENLAYERS);Xx.prototype.getMap=Xx.prototype.Nl;
Xx.prototype.getMeridians=Xx.prototype.ek;Xx.prototype.getParallels=Xx.prototype.lk;Xx.prototype.setMap=Xx.prototype.setMap;u("ol.has.DEVICE_PIXEL_RATIO",Ui,OPENLAYERS);u("ol.has.CANVAS",Wi,OPENLAYERS);u("ol.has.DEVICE_ORIENTATION",Xi,OPENLAYERS);u("ol.has.GEOLOCATION",Yi,OPENLAYERS);u("ol.has.TOUCH",Zi,OPENLAYERS);u("ol.has.WEBGL",Ti,OPENLAYERS);by.prototype.getImage=by.prototype.a;cy.prototype.getImage=cy.prototype.Ua;u("ol.Kinetic",Ik,OPENLAYERS);u("ol.loadingstrategy.all",yp,OPENLAYERS);
u("ol.loadingstrategy.bbox",function(b){return[b]},OPENLAYERS);u("ol.loadingstrategy.tile",function(b){return function(c,d){var e=Gh(b,d),f=Bh(b,c,e),g=[],e=[e,0,0];for(e[1]=f.a;e[1]<=f.c;++e[1])for(e[2]=f.f;e[2]<=f.b;++e[2])g.push(b.Ba(e));return g}},OPENLAYERS);u("ol.Map",T,OPENLAYERS);T.prototype.addControl=T.prototype.qj;T.prototype.addInteraction=T.prototype.rj;T.prototype.addLayer=T.prototype.og;T.prototype.addOverlay=T.prototype.pg;T.prototype.beforeRender=T.prototype.Pa;
T.prototype.forEachFeatureAtPixel=T.prototype.rd;T.prototype.forEachLayerAtPixel=T.prototype.Rl;T.prototype.hasFeatureAtPixel=T.prototype.jl;T.prototype.getEventCoordinate=T.prototype.Sj;T.prototype.getEventPixel=T.prototype.be;T.prototype.getTarget=T.prototype.fh;T.prototype.getTargetElement=T.prototype.uc;T.prototype.getCoordinateFromPixel=T.prototype.Ia;T.prototype.getControls=T.prototype.Qj;T.prototype.getOverlays=T.prototype.jk;T.prototype.getOverlayById=T.prototype.ik;
T.prototype.getInteractions=T.prototype.Xj;T.prototype.getLayerGroup=T.prototype.tc;T.prototype.getLayers=T.prototype.eh;T.prototype.getPixelFromCoordinate=T.prototype.Ra;T.prototype.getSize=T.prototype.Ta;T.prototype.getView=T.prototype.aa;T.prototype.getViewport=T.prototype.yk;T.prototype.renderSync=T.prototype.No;T.prototype.render=T.prototype.render;T.prototype.removeControl=T.prototype.Go;T.prototype.removeInteraction=T.prototype.Ho;T.prototype.removeLayer=T.prototype.Jo;
T.prototype.removeOverlay=T.prototype.Ko;T.prototype.setLayerGroup=T.prototype.gi;T.prototype.setSize=T.prototype.Zf;T.prototype.setTarget=T.prototype.Sl;T.prototype.setView=T.prototype.ap;T.prototype.updateSize=T.prototype.Xc;Jj.prototype.originalEvent=Jj.prototype.originalEvent;Jj.prototype.pixel=Jj.prototype.pixel;Jj.prototype.coordinate=Jj.prototype.coordinate;Jj.prototype.dragging=Jj.prototype.dragging;Jj.prototype.preventDefault=Jj.prototype.preventDefault;Jj.prototype.stopPropagation=Jj.prototype.b;
lh.prototype.map=lh.prototype.map;lh.prototype.frameState=lh.prototype.frameState;ed.prototype.key=ed.prototype.key;ed.prototype.oldValue=ed.prototype.oldValue;u("ol.Object",fd,OPENLAYERS);fd.prototype.get=fd.prototype.get;fd.prototype.getKeys=fd.prototype.P;fd.prototype.getProperties=fd.prototype.R;fd.prototype.set=fd.prototype.set;fd.prototype.setProperties=fd.prototype.I;fd.prototype.unset=fd.prototype.S;u("ol.Observable",cd,OPENLAYERS);u("ol.Observable.unByKey",dd,OPENLAYERS);
cd.prototype.changed=cd.prototype.u;cd.prototype.dispatchEvent=cd.prototype.s;cd.prototype.getRevision=cd.prototype.L;cd.prototype.on=cd.prototype.H;cd.prototype.once=cd.prototype.M;cd.prototype.un=cd.prototype.K;cd.prototype.unByKey=cd.prototype.N;u("ol.inherits",z,OPENLAYERS);u("ol.Overlay",or,OPENLAYERS);or.prototype.getElement=or.prototype.ue;or.prototype.getId=or.prototype.Qa;or.prototype.getMap=or.prototype.ve;or.prototype.getOffset=or.prototype.Kg;or.prototype.getPosition=or.prototype.gh;
or.prototype.getPositioning=or.prototype.Lg;or.prototype.setElement=or.prototype.ci;or.prototype.setMap=or.prototype.setMap;or.prototype.setOffset=or.prototype.ii;or.prototype.setPosition=or.prototype.Cf;or.prototype.setPositioning=or.prototype.li;u("ol.render.toContext",function(b,c){var d=b.canvas,e=c?c:{},f=e.pixelRatio||Ui;if(e=e.size)d.width=e[0]*f,d.height=e[1]*f,d.style.width=e[0]+"px",d.style.height=e[1]+"px";d=[0,0,d.width,d.height];e=fk(Ad(),0,0,f,f,0,0,0);return new lm(b,f,d,e,0)},OPENLAYERS);
u("ol.size.toSize",ld,OPENLAYERS);sh.prototype.getTileCoord=sh.prototype.c;Go.prototype.getFormat=Go.prototype.Tl;Go.prototype.setFeatures=Go.prototype.di;Go.prototype.setLoader=Go.prototype.hi;u("ol.View",Nf,OPENLAYERS);Nf.prototype.constrainCenter=Nf.prototype.Yd;Nf.prototype.constrainResolution=Nf.prototype.constrainResolution;Nf.prototype.constrainRotation=Nf.prototype.constrainRotation;Nf.prototype.getCenter=Nf.prototype.Va;Nf.prototype.calculateExtent=Nf.prototype.bd;
Nf.prototype.getProjection=Nf.prototype.Ul;Nf.prototype.getResolution=Nf.prototype.$;Nf.prototype.getRotation=Nf.prototype.Ha;Nf.prototype.getZoom=Nf.prototype.Ak;Nf.prototype.fit=Nf.prototype.mf;Nf.prototype.centerOn=Nf.prototype.Aj;Nf.prototype.rotate=Nf.prototype.rotate;Nf.prototype.setCenter=Nf.prototype.mb;Nf.prototype.setResolution=Nf.prototype.Vb;Nf.prototype.setRotation=Nf.prototype.we;Nf.prototype.setZoom=Nf.prototype.ep;u("ol.xml.getAllTextContent",Qo,OPENLAYERS);u("ol.xml.parse",jp,OPENLAYERS);
wq.prototype.getGL=wq.prototype.On;wq.prototype.useProgram=wq.prototype.Je;u("ol.tilegrid.TileGrid",xh,OPENLAYERS);xh.prototype.getMaxZoom=xh.prototype.Ig;xh.prototype.getMinZoom=xh.prototype.Jg;xh.prototype.getOrigin=xh.prototype.Ea;xh.prototype.getResolution=xh.prototype.$;xh.prototype.getResolutions=xh.prototype.Fh;xh.prototype.getTileCoordExtent=xh.prototype.Ba;xh.prototype.getTileCoordForCoordAndResolution=xh.prototype.he;xh.prototype.getTileCoordForCoordAndZ=xh.prototype.ie;
xh.prototype.getTileSize=xh.prototype.Ma;u("ol.tilegrid.createXYZ",Kh,OPENLAYERS);u("ol.tilegrid.WMTS",HA,OPENLAYERS);HA.prototype.getMatrixIds=HA.prototype.o;u("ol.tilegrid.WMTS.createFromCapabilitiesMatrixSet",IA,OPENLAYERS);u("ol.style.AtlasManager",function(b){b=b||{};this.f=void 0!==b.initialSize?b.initialSize:256;this.b=void 0!==b.maxSize?b.maxSize:void 0!==wa?wa:2048;this.a=void 0!==b.space?b.space:1;this.g=[new OA(this.f,this.a)];this.c=this.f;this.i=[new OA(this.c,this.a)]},OPENLAYERS);
u("ol.style.Circle",cm,OPENLAYERS);cm.prototype.getFill=cm.prototype.nn;cm.prototype.getImage=cm.prototype.hc;cm.prototype.getRadius=cm.prototype.pn;cm.prototype.getStroke=cm.prototype.qn;u("ol.style.Fill",Vl,OPENLAYERS);Vl.prototype.getColor=Vl.prototype.b;Vl.prototype.setColor=Vl.prototype.c;u("ol.style.Icon",sk,OPENLAYERS);sk.prototype.getAnchor=sk.prototype.Yb;sk.prototype.getImage=sk.prototype.hc;sk.prototype.getOrigin=sk.prototype.Ea;sk.prototype.getSrc=sk.prototype.rn;
sk.prototype.getSize=sk.prototype.Eb;sk.prototype.load=sk.prototype.load;u("ol.style.Image",rk,OPENLAYERS);rk.prototype.getOpacity=rk.prototype.De;rk.prototype.getRotateWithView=rk.prototype.fe;rk.prototype.getRotation=rk.prototype.Ee;rk.prototype.getScale=rk.prototype.Fe;rk.prototype.getSnapToPixel=rk.prototype.ge;rk.prototype.setOpacity=rk.prototype.Ge;rk.prototype.setRotation=rk.prototype.He;rk.prototype.setScale=rk.prototype.Ie;u("ol.style.RegularShape",PA,OPENLAYERS);PA.prototype.getAnchor=PA.prototype.Yb;
PA.prototype.getAngle=PA.prototype.sn;PA.prototype.getFill=PA.prototype.tn;PA.prototype.getImage=PA.prototype.hc;PA.prototype.getOrigin=PA.prototype.Ea;PA.prototype.getPoints=PA.prototype.vn;PA.prototype.getRadius=PA.prototype.wn;PA.prototype.getRadius2=PA.prototype.qk;PA.prototype.getSize=PA.prototype.Eb;PA.prototype.getStroke=PA.prototype.xn;u("ol.style.Stroke",am,OPENLAYERS);am.prototype.getColor=am.prototype.yn;am.prototype.getLineCap=am.prototype.$j;am.prototype.getLineDash=am.prototype.zn;
am.prototype.getLineJoin=am.prototype.ak;am.prototype.getMiterLimit=am.prototype.fk;am.prototype.getWidth=am.prototype.An;am.prototype.setColor=am.prototype.Bn;am.prototype.setLineCap=am.prototype.Wo;am.prototype.setLineDash=am.prototype.Cn;am.prototype.setLineJoin=am.prototype.Xo;am.prototype.setMiterLimit=am.prototype.Yo;am.prototype.setWidth=am.prototype.bp;u("ol.style.Style",em,OPENLAYERS);em.prototype.getGeometry=em.prototype.W;em.prototype.getGeometryFunction=em.prototype.Vj;
em.prototype.getFill=em.prototype.Dn;em.prototype.getImage=em.prototype.En;em.prototype.getStroke=em.prototype.Fn;em.prototype.getText=em.prototype.Da;em.prototype.getZIndex=em.prototype.Gn;em.prototype.setGeometry=em.prototype.Eh;em.prototype.setZIndex=em.prototype.Hn;u("ol.style.Text",bu,OPENLAYERS);bu.prototype.getFont=bu.prototype.Tj;bu.prototype.getOffsetX=bu.prototype.gk;bu.prototype.getOffsetY=bu.prototype.hk;bu.prototype.getFill=bu.prototype.In;bu.prototype.getRotation=bu.prototype.Jn;
bu.prototype.getScale=bu.prototype.Kn;bu.prototype.getStroke=bu.prototype.Ln;bu.prototype.getText=bu.prototype.Da;bu.prototype.getTextAlign=bu.prototype.uk;bu.prototype.getTextBaseline=bu.prototype.vk;bu.prototype.setFont=bu.prototype.To;bu.prototype.setOffsetX=bu.prototype.ji;bu.prototype.setOffsetY=bu.prototype.ki;bu.prototype.setFill=bu.prototype.So;bu.prototype.setRotation=bu.prototype.Mn;bu.prototype.setScale=bu.prototype.Nn;bu.prototype.setStroke=bu.prototype.Zo;bu.prototype.setText=bu.prototype.mi;
bu.prototype.setTextAlign=bu.prototype.ni;bu.prototype.setTextBaseline=bu.prototype.$o;u("ol.Sphere",ye,OPENLAYERS);ye.prototype.geodesicArea=ye.prototype.f;ye.prototype.haversineDistance=ye.prototype.a;u("ol.source.BingMaps",Oz,OPENLAYERS);u("ol.source.BingMaps.TOS_ATTRIBUTION",Pz,OPENLAYERS);u("ol.source.Cluster",Qz,OPENLAYERS);Qz.prototype.getSource=Qz.prototype.ia;u("ol.source.ImageCanvas",tn,OPENLAYERS);u("ol.source.ImageMapGuide",Tz,OPENLAYERS);Tz.prototype.getParams=Tz.prototype.Pm;
Tz.prototype.getImageLoadFunction=Tz.prototype.Om;Tz.prototype.updateParams=Tz.prototype.Rm;Tz.prototype.setImageLoadFunction=Tz.prototype.Qm;u("ol.source.Image",mn,OPENLAYERS);on.prototype.image=on.prototype.image;u("ol.source.ImageStatic",Uz,OPENLAYERS);u("ol.source.ImageVector",Rp,OPENLAYERS);Rp.prototype.getSource=Rp.prototype.Sm;Rp.prototype.getStyle=Rp.prototype.Tm;Rp.prototype.getStyleFunction=Rp.prototype.Um;Rp.prototype.setStyle=Rp.prototype.vh;u("ol.source.ImageWMS",Vz,OPENLAYERS);
Vz.prototype.getGetFeatureInfoUrl=Vz.prototype.Xm;Vz.prototype.getParams=Vz.prototype.Zm;Vz.prototype.getImageLoadFunction=Vz.prototype.Ym;Vz.prototype.getUrl=Vz.prototype.$m;Vz.prototype.setImageLoadFunction=Vz.prototype.an;Vz.prototype.setUrl=Vz.prototype.bn;Vz.prototype.updateParams=Vz.prototype.cn;u("ol.source.MapQuest",bA,OPENLAYERS);bA.prototype.getLayer=bA.prototype.l;u("ol.source.OSM",$z,OPENLAYERS);u("ol.source.OSM.ATTRIBUTION",aA,OPENLAYERS);u("ol.source.Raster",eA,OPENLAYERS);
eA.prototype.setOperation=eA.prototype.v;jA.prototype.extent=jA.prototype.extent;jA.prototype.resolution=jA.prototype.resolution;jA.prototype.data=jA.prototype.data;u("ol.source.Source",uh,OPENLAYERS);uh.prototype.getAttributions=uh.prototype.ta;uh.prototype.getLogo=uh.prototype.ra;uh.prototype.getProjection=uh.prototype.ua;uh.prototype.getState=uh.prototype.va;uh.prototype.setAttributions=uh.prototype.oa;u("ol.source.Stamen",oA,OPENLAYERS);u("ol.source.TileArcGISRest",qA,OPENLAYERS);
qA.prototype.getParams=qA.prototype.v;qA.prototype.updateParams=qA.prototype.C;u("ol.source.TileDebug",sA,OPENLAYERS);u("ol.source.TileImage",Y,OPENLAYERS);Y.prototype.setRenderReprojectionEdges=Y.prototype.xb;Y.prototype.setTileGridForProjection=Y.prototype.yb;u("ol.source.TileJSON",wA,OPENLAYERS);u("ol.source.Tile",Lh,OPENLAYERS);Lh.prototype.getTileGrid=Lh.prototype.Ja;Ph.prototype.tile=Ph.prototype.tile;u("ol.source.TileUTFGrid",xA,OPENLAYERS);xA.prototype.getTemplate=xA.prototype.tk;
xA.prototype.forDataAtCoordinateAndResolution=xA.prototype.Fj;u("ol.source.TileWMS",CA,OPENLAYERS);CA.prototype.getGetFeatureInfoUrl=CA.prototype.gn;CA.prototype.getParams=CA.prototype.hn;CA.prototype.updateParams=CA.prototype.jn;aq.prototype.getTileLoadFunction=aq.prototype.Za;aq.prototype.getTileUrlFunction=aq.prototype.$a;aq.prototype.getUrls=aq.prototype.ab;aq.prototype.setTileLoadFunction=aq.prototype.gb;aq.prototype.setTileUrlFunction=aq.prototype.La;aq.prototype.setUrl=aq.prototype.Wa;
aq.prototype.setUrls=aq.prototype.Xa;u("ol.source.Vector",Jp,OPENLAYERS);Jp.prototype.addFeature=Jp.prototype.Dd;Jp.prototype.addFeatures=Jp.prototype.Ic;Jp.prototype.clear=Jp.prototype.clear;Jp.prototype.forEachFeature=Jp.prototype.wg;Jp.prototype.forEachFeatureInExtent=Jp.prototype.rb;Jp.prototype.forEachFeatureIntersectingExtent=Jp.prototype.xg;Jp.prototype.getFeaturesCollection=Jp.prototype.Eg;Jp.prototype.getFeatures=Jp.prototype.Be;Jp.prototype.getFeaturesAtCoordinate=Jp.prototype.Dg;
Jp.prototype.getFeaturesInExtent=Jp.prototype.pf;Jp.prototype.getClosestFeatureToCoordinate=Jp.prototype.zg;Jp.prototype.getExtent=Jp.prototype.J;Jp.prototype.getFeatureById=Jp.prototype.Cg;Jp.prototype.removeFeature=Jp.prototype.Sc;Op.prototype.feature=Op.prototype.feature;u("ol.source.VectorTile",bq,OPENLAYERS);u("ol.source.WMTS",Z,OPENLAYERS);Z.prototype.getDimensions=Z.prototype.Rj;Z.prototype.getFormat=Z.prototype.kn;Z.prototype.getLayer=Z.prototype.ln;Z.prototype.getMatrixSet=Z.prototype.dk;
Z.prototype.getRequestEncoding=Z.prototype.rk;Z.prototype.getStyle=Z.prototype.mn;Z.prototype.getVersion=Z.prototype.xk;Z.prototype.updateDimensions=Z.prototype.lp;
u("ol.source.WMTS.optionsFromCapabilities",function(b,c){var d=eb(b.Contents.Layer,function(b){return b.Identifier==c.layer}),e=b.Contents.TileMatrixSet,f,g;f=1<d.TileMatrixSetLink.length?"projection"in c?fb(d.TileMatrixSetLink,function(b){return eb(e,function(c){return c.Identifier==b.TileMatrixSet}).SupportedCRS.replace(/urn:ogc:def:crs:(\w+):(.*:)?(\w+)$/,"$1:$3")==c.projection}):fb(d.TileMatrixSetLink,function(b){return b.TileMatrixSet==c.matrixSet}):0;0>f&&(f=0);g=d.TileMatrixSetLink[f].TileMatrixSet;
var h=d.Format[0];"format"in c&&(h=c.format);f=fb(d.Style,function(b){return"style"in c?b.Title==c.style:b.isDefault});0>f&&(f=0);f=d.Style[f].Identifier;var k={};"Dimension"in d&&d.Dimension.forEach(function(b){var c=b.Identifier,d=b.Default;void 0===d&&(d=b.Value[0]);k[c]=d});var m=eb(b.Contents.TileMatrixSet,function(b){return b.Identifier==g}),n;n="projection"in c?Ee(c.projection):Ee(m.SupportedCRS.replace(/urn:ogc:def:crs:(\w+):(.*:)?(\w+)$/,"$1:$3"));var p=d.WGS84BoundingBox,q,r;void 0!==p&&
(r=Ee("EPSG:4326").J(),r=p[0]==r[0]&&p[2]==r[2],q=Ze(p,"EPSG:4326",n),(p=n.J())&&(Ud(p,q)||(q=void 0)));var m=IA(m,q),t=[];q=c.requestEncoding;q=void 0!==q?q:"";if(b.hasOwnProperty("OperationsMetadata")&&b.OperationsMetadata.hasOwnProperty("GetTile")&&0!==q.indexOf("REST"))for(var d=b.OperationsMetadata.GetTile.DCP.HTTP.Get,p=0,v=d.length;p<v;++p){var x=eb(d[p].Constraint,function(b){return"GetEncoding"==b.name}).AllowedValues.Value;0<x.length&&ub(x,"KVP")&&(q="KVP",t.push(d[p].href))}else q="REST",
d.ResourceURL.forEach(function(b){"tile"==b.resourceType&&(h=b.format,t.push(b.template))});return{urls:t,layer:c.layer,matrixSet:g,format:h,projection:n,requestEncoding:q,tileGrid:m,style:f,dimensions:k,wrapX:r}},OPENLAYERS);u("ol.source.XYZ",Zz,OPENLAYERS);u("ol.source.Zoomify",KA,OPENLAYERS);ak.prototype.vectorContext=ak.prototype.vectorContext;ak.prototype.frameState=ak.prototype.frameState;ak.prototype.context=ak.prototype.context;ak.prototype.glContext=ak.prototype.glContext;
Xm.prototype.get=Xm.prototype.get;Xm.prototype.getExtent=Xm.prototype.J;Xm.prototype.getGeometry=Xm.prototype.W;Xm.prototype.getProperties=Xm.prototype.Km;Xm.prototype.getType=Xm.prototype.V;u("ol.render.VectorContext",Zj,OPENLAYERS);Tq.prototype.drawAsync=Tq.prototype.pd;Tq.prototype.drawCircleGeometry=Tq.prototype.Jc;Tq.prototype.drawFeature=Tq.prototype.lf;Tq.prototype.drawGeometryCollectionGeometry=Tq.prototype.Zd;Tq.prototype.drawPointGeometry=Tq.prototype.Jb;
Tq.prototype.drawLineStringGeometry=Tq.prototype.Xb;Tq.prototype.drawMultiLineStringGeometry=Tq.prototype.Kc;Tq.prototype.drawMultiPointGeometry=Tq.prototype.Ib;Tq.prototype.drawMultiPolygonGeometry=Tq.prototype.Lc;Tq.prototype.drawPolygonGeometry=Tq.prototype.Mc;Tq.prototype.drawText=Tq.prototype.Kb;Tq.prototype.setFillStrokeStyle=Tq.prototype.eb;Tq.prototype.setImageStyle=Tq.prototype.wb;Tq.prototype.setTextStyle=Tq.prototype.fb;lm.prototype.drawAsync=lm.prototype.pd;
lm.prototype.drawCircleGeometry=lm.prototype.Jc;lm.prototype.drawFeature=lm.prototype.lf;lm.prototype.drawPointGeometry=lm.prototype.Jb;lm.prototype.drawMultiPointGeometry=lm.prototype.Ib;lm.prototype.drawLineStringGeometry=lm.prototype.Xb;lm.prototype.drawMultiLineStringGeometry=lm.prototype.Kc;lm.prototype.drawPolygonGeometry=lm.prototype.Mc;lm.prototype.drawMultiPolygonGeometry=lm.prototype.Lc;lm.prototype.setFillStrokeStyle=lm.prototype.eb;lm.prototype.setImageStyle=lm.prototype.wb;
lm.prototype.setTextStyle=lm.prototype.fb;u("ol.proj.common.add",Ql,OPENLAYERS);u("ol.proj.METERS_PER_UNIT",Ae,OPENLAYERS);u("ol.proj.Projection",Be,OPENLAYERS);Be.prototype.getCode=Be.prototype.Pj;Be.prototype.getExtent=Be.prototype.J;Be.prototype.getUnits=Be.prototype.Im;Be.prototype.getMetersPerUnit=Be.prototype.$b;Be.prototype.getWorldExtent=Be.prototype.zk;Be.prototype.isGlobal=Be.prototype.ol;Be.prototype.setGlobal=Be.prototype.Vo;Be.prototype.setExtent=Be.prototype.Jm;
Be.prototype.setWorldExtent=Be.prototype.cp;Be.prototype.setGetPointResolution=Be.prototype.Uo;Be.prototype.getPointResolution=Be.prototype.getPointResolution;u("ol.proj.setProj4",function(b){De=b},OPENLAYERS);u("ol.proj.addEquivalentProjections",Fe,OPENLAYERS);u("ol.proj.addProjection",Se,OPENLAYERS);u("ol.proj.addCoordinateTransforms",Ge,OPENLAYERS);u("ol.proj.fromLonLat",function(b,c){return Ye(b,"EPSG:4326",void 0!==c?c:"EPSG:3857")},OPENLAYERS);
u("ol.proj.toLonLat",function(b,c){return Ye(b,void 0!==c?c:"EPSG:3857","EPSG:4326")},OPENLAYERS);u("ol.proj.get",Ee,OPENLAYERS);u("ol.proj.getTransform",We,OPENLAYERS);u("ol.proj.transform",Ye,OPENLAYERS);u("ol.proj.transformExtent",Ze,OPENLAYERS);u("ol.layer.Heatmap",X,OPENLAYERS);X.prototype.getBlur=X.prototype.yg;X.prototype.getGradient=X.prototype.Gg;X.prototype.getRadius=X.prototype.ph;X.prototype.setBlur=X.prototype.ai;X.prototype.setGradient=X.prototype.fi;X.prototype.setRadius=X.prototype.qh;
u("ol.layer.Image",Rl,OPENLAYERS);Rl.prototype.getSource=Rl.prototype.ea;u("ol.layer.Layer",bk,OPENLAYERS);bk.prototype.getSource=bk.prototype.ea;bk.prototype.setMap=bk.prototype.setMap;bk.prototype.setSource=bk.prototype.Dc;u("ol.layer.Base",Xj,OPENLAYERS);Xj.prototype.getExtent=Xj.prototype.J;Xj.prototype.getMaxResolution=Xj.prototype.Ob;Xj.prototype.getMinResolution=Xj.prototype.Pb;Xj.prototype.getOpacity=Xj.prototype.Sb;Xj.prototype.getVisible=Xj.prototype.tb;Xj.prototype.getZIndex=Xj.prototype.Tb;
Xj.prototype.setExtent=Xj.prototype.dc;Xj.prototype.setMaxResolution=Xj.prototype.lc;Xj.prototype.setMinResolution=Xj.prototype.mc;Xj.prototype.setOpacity=Xj.prototype.ec;Xj.prototype.setVisible=Xj.prototype.fc;Xj.prototype.setZIndex=Xj.prototype.gc;u("ol.layer.Group",Hl,OPENLAYERS);Hl.prototype.getLayers=Hl.prototype.Rc;Hl.prototype.setLayers=Hl.prototype.oh;u("ol.layer.Tile",H,OPENLAYERS);H.prototype.getPreload=H.prototype.a;H.prototype.getSource=H.prototype.ea;H.prototype.setPreload=H.prototype.c;
H.prototype.getUseInterimTilesOnError=H.prototype.b;H.prototype.setUseInterimTilesOnError=H.prototype.g;u("ol.layer.Vector",J,OPENLAYERS);J.prototype.getSource=J.prototype.ea;J.prototype.getStyle=J.prototype.C;J.prototype.getStyleFunction=J.prototype.D;J.prototype.setStyle=J.prototype.c;u("ol.layer.VectorTile",L,OPENLAYERS);L.prototype.getPreload=L.prototype.g;L.prototype.getSource=L.prototype.ea;L.prototype.getUseInterimTilesOnError=L.prototype.U;L.prototype.setPreload=L.prototype.T;
L.prototype.setUseInterimTilesOnError=L.prototype.Y;u("ol.interaction.DoubleClickZoom",Ok,OPENLAYERS);u("ol.interaction.DoubleClickZoom.handleEvent",Pk,OPENLAYERS);u("ol.interaction.DragAndDrop",vy,OPENLAYERS);u("ol.interaction.DragAndDrop.handleEvent",se,OPENLAYERS);wy.prototype.features=wy.prototype.features;wy.prototype.file=wy.prototype.file;wy.prototype.projection=wy.prototype.projection;kl.prototype.coordinate=kl.prototype.coordinate;kl.prototype.mapBrowserEvent=kl.prototype.mapBrowserEvent;
u("ol.interaction.DragBox",ll,OPENLAYERS);ll.prototype.getGeometry=ll.prototype.W;u("ol.interaction.DragPan",$k,OPENLAYERS);u("ol.interaction.DragRotateAndZoom",zy,OPENLAYERS);u("ol.interaction.DragRotate",dl,OPENLAYERS);u("ol.interaction.DragZoom",rl,OPENLAYERS);Dy.prototype.feature=Dy.prototype.feature;u("ol.interaction.Draw",Ey,OPENLAYERS);u("ol.interaction.Draw.handleEvent",Gy,OPENLAYERS);Ey.prototype.removeLastPoint=Ey.prototype.Io;Ey.prototype.finishDrawing=Ey.prototype.qd;
Ey.prototype.extend=Ey.prototype.nm;u("ol.interaction.Draw.createRegularPolygon",function(b,c){return function(d,e){var f=d[0],g=d[1],h=Math.sqrt(ud(f,g)),k=e?e:Lf(new Sx(f),b);Mf(k,f,h,c?c:Math.atan((g[1]-f[1])/(g[0]-f[0])));return k}},OPENLAYERS);u("ol.interaction.Interaction",Kk,OPENLAYERS);Kk.prototype.getActive=Kk.prototype.b;Kk.prototype.getMap=Kk.prototype.i;Kk.prototype.setActive=Kk.prototype.g;u("ol.interaction.defaults",Gl,OPENLAYERS);u("ol.interaction.KeyboardPan",sl,OPENLAYERS);
u("ol.interaction.KeyboardPan.handleEvent",tl,OPENLAYERS);u("ol.interaction.KeyboardZoom",ul,OPENLAYERS);u("ol.interaction.KeyboardZoom.handleEvent",vl,OPENLAYERS);Uy.prototype.features=Uy.prototype.features;Uy.prototype.mapBrowserPointerEvent=Uy.prototype.mapBrowserPointerEvent;u("ol.interaction.Modify",Vy,OPENLAYERS);u("ol.interaction.Modify.handleEvent",Yy,OPENLAYERS);u("ol.interaction.MouseWheelZoom",wl,OPENLAYERS);u("ol.interaction.MouseWheelZoom.handleEvent",xl,OPENLAYERS);
wl.prototype.setMouseAnchor=wl.prototype.D;u("ol.interaction.PinchRotate",yl,OPENLAYERS);u("ol.interaction.PinchZoom",Cl,OPENLAYERS);u("ol.interaction.Pointer",Xk,OPENLAYERS);u("ol.interaction.Pointer.handleEvent",Yk,OPENLAYERS);hz.prototype.selected=hz.prototype.selected;hz.prototype.deselected=hz.prototype.deselected;hz.prototype.mapBrowserEvent=hz.prototype.mapBrowserEvent;u("ol.interaction.Select",iz,OPENLAYERS);iz.prototype.getFeatures=iz.prototype.xm;iz.prototype.getLayer=iz.prototype.ym;
u("ol.interaction.Select.handleEvent",jz,OPENLAYERS);iz.prototype.setMap=iz.prototype.setMap;u("ol.interaction.Snap",lz,OPENLAYERS);lz.prototype.addFeature=lz.prototype.zd;lz.prototype.removeFeature=lz.prototype.Ad;pz.prototype.features=pz.prototype.features;pz.prototype.coordinate=pz.prototype.coordinate;u("ol.interaction.Translate",qz,OPENLAYERS);u("ol.geom.Circle",Sx,OPENLAYERS);Sx.prototype.clone=Sx.prototype.clone;Sx.prototype.getCenter=Sx.prototype.yd;Sx.prototype.getRadius=Sx.prototype.Df;
Sx.prototype.getType=Sx.prototype.V;Sx.prototype.intersectsExtent=Sx.prototype.Fa;Sx.prototype.setCenter=Sx.prototype.fm;Sx.prototype.setCenterAndRadius=Sx.prototype.Yf;Sx.prototype.setRadius=Sx.prototype.gm;Sx.prototype.transform=Sx.prototype.nb;u("ol.geom.Geometry",$e,OPENLAYERS);$e.prototype.getClosestPoint=$e.prototype.sb;$e.prototype.getExtent=$e.prototype.J;$e.prototype.simplify=$e.prototype.zb;$e.prototype.transform=$e.prototype.nb;u("ol.geom.GeometryCollection",ms,OPENLAYERS);
ms.prototype.clone=ms.prototype.clone;ms.prototype.getGeometries=ms.prototype.Fg;ms.prototype.getType=ms.prototype.V;ms.prototype.intersectsExtent=ms.prototype.Fa;ms.prototype.setGeometries=ms.prototype.ei;ms.prototype.applyTransform=ms.prototype.qc;ms.prototype.translate=ms.prototype.Qc;u("ol.geom.LinearRing",vf,OPENLAYERS);vf.prototype.clone=vf.prototype.clone;vf.prototype.getArea=vf.prototype.jm;vf.prototype.getCoordinates=vf.prototype.Z;vf.prototype.getType=vf.prototype.V;
vf.prototype.setCoordinates=vf.prototype.ma;u("ol.geom.LineString",U,OPENLAYERS);U.prototype.appendCoordinate=U.prototype.sj;U.prototype.clone=U.prototype.clone;U.prototype.forEachSegment=U.prototype.Ij;U.prototype.getCoordinateAtM=U.prototype.hm;U.prototype.getCoordinates=U.prototype.Z;U.prototype.getCoordinateAt=U.prototype.Ag;U.prototype.getLength=U.prototype.im;U.prototype.getType=U.prototype.V;U.prototype.intersectsExtent=U.prototype.Fa;U.prototype.setCoordinates=U.prototype.ma;
u("ol.geom.MultiLineString",V,OPENLAYERS);V.prototype.appendLineString=V.prototype.tj;V.prototype.clone=V.prototype.clone;V.prototype.getCoordinateAtM=V.prototype.km;V.prototype.getCoordinates=V.prototype.Z;V.prototype.getLineString=V.prototype.bk;V.prototype.getLineStrings=V.prototype.ud;V.prototype.getType=V.prototype.V;V.prototype.intersectsExtent=V.prototype.Fa;V.prototype.setCoordinates=V.prototype.ma;u("ol.geom.MultiPoint",bs,OPENLAYERS);bs.prototype.appendPoint=bs.prototype.vj;
bs.prototype.clone=bs.prototype.clone;bs.prototype.getCoordinates=bs.prototype.Z;bs.prototype.getPoint=bs.prototype.mk;bs.prototype.getPoints=bs.prototype.xe;bs.prototype.getType=bs.prototype.V;bs.prototype.intersectsExtent=bs.prototype.Fa;bs.prototype.setCoordinates=bs.prototype.ma;u("ol.geom.MultiPolygon",cs,OPENLAYERS);cs.prototype.appendPolygon=cs.prototype.wj;cs.prototype.clone=cs.prototype.clone;cs.prototype.getArea=cs.prototype.lm;cs.prototype.getCoordinates=cs.prototype.Z;
cs.prototype.getInteriorPoints=cs.prototype.Zj;cs.prototype.getPolygon=cs.prototype.pk;cs.prototype.getPolygons=cs.prototype.ee;cs.prototype.getType=cs.prototype.V;cs.prototype.intersectsExtent=cs.prototype.Fa;cs.prototype.setCoordinates=cs.prototype.ma;u("ol.geom.Point",F,OPENLAYERS);F.prototype.clone=F.prototype.clone;F.prototype.getCoordinates=F.prototype.Z;F.prototype.getType=F.prototype.V;F.prototype.intersectsExtent=F.prototype.Fa;F.prototype.setCoordinates=F.prototype.ma;
u("ol.geom.Polygon",G,OPENLAYERS);G.prototype.appendLinearRing=G.prototype.uj;G.prototype.clone=G.prototype.clone;G.prototype.getArea=G.prototype.mm;G.prototype.getCoordinates=G.prototype.Z;G.prototype.getInteriorPoint=G.prototype.Yj;G.prototype.getLinearRingCount=G.prototype.ck;G.prototype.getLinearRing=G.prototype.Hg;G.prototype.getLinearRings=G.prototype.de;G.prototype.getType=G.prototype.V;G.prototype.intersectsExtent=G.prototype.Fa;G.prototype.setCoordinates=G.prototype.ma;
u("ol.geom.Polygon.circular",Jf,OPENLAYERS);u("ol.geom.Polygon.fromExtent",Kf,OPENLAYERS);u("ol.geom.Polygon.fromCircle",Lf,OPENLAYERS);u("ol.geom.SimpleGeometry",bf,OPENLAYERS);bf.prototype.getFirstCoordinate=bf.prototype.Lb;bf.prototype.getLastCoordinate=bf.prototype.Mb;bf.prototype.getLayout=bf.prototype.Nb;bf.prototype.applyTransform=bf.prototype.qc;bf.prototype.translate=bf.prototype.Qc;u("ol.format.EsriJSON",fs,OPENLAYERS);fs.prototype.readFeature=fs.prototype.Ub;fs.prototype.readFeatures=fs.prototype.Ca;
fs.prototype.readGeometry=fs.prototype.Uc;fs.prototype.readProjection=fs.prototype.Ka;fs.prototype.writeGeometry=fs.prototype.Zc;fs.prototype.writeGeometryObject=fs.prototype.We;fs.prototype.writeFeature=fs.prototype.Ld;fs.prototype.writeFeatureObject=fs.prototype.Yc;fs.prototype.writeFeatures=fs.prototype.Wb;fs.prototype.writeFeaturesObject=fs.prototype.Ue;u("ol.format.Feature",Sr,OPENLAYERS);u("ol.format.GeoJSON",qs,OPENLAYERS);qs.prototype.readFeature=qs.prototype.Ub;
qs.prototype.readFeatures=qs.prototype.Ca;qs.prototype.readGeometry=qs.prototype.Uc;qs.prototype.readProjection=qs.prototype.Ka;qs.prototype.writeFeature=qs.prototype.Ld;qs.prototype.writeFeatureObject=qs.prototype.Yc;qs.prototype.writeFeatures=qs.prototype.Wb;qs.prototype.writeFeaturesObject=qs.prototype.Ue;qs.prototype.writeGeometry=qs.prototype.Zc;qs.prototype.writeGeometryObject=qs.prototype.We;u("ol.format.GPX",Us,OPENLAYERS);Us.prototype.readFeature=Us.prototype.Ub;
Us.prototype.readFeatures=Us.prototype.Ca;Us.prototype.readProjection=Us.prototype.Ka;Us.prototype.writeFeatures=Us.prototype.Wb;Us.prototype.writeFeaturesNode=Us.prototype.f;u("ol.format.IGC",Et,OPENLAYERS);Et.prototype.readFeature=Et.prototype.Ub;Et.prototype.readFeatures=Et.prototype.Ca;Et.prototype.readProjection=Et.prototype.Ka;u("ol.format.KML",cu,OPENLAYERS);cu.prototype.readFeature=cu.prototype.Ub;cu.prototype.readFeatures=cu.prototype.Ca;cu.prototype.readName=cu.prototype.xo;
cu.prototype.readNetworkLinks=cu.prototype.yo;cu.prototype.readProjection=cu.prototype.Ka;cu.prototype.writeFeatures=cu.prototype.Wb;cu.prototype.writeFeaturesNode=cu.prototype.f;u("ol.format.MVT",Rv,OPENLAYERS);Rv.prototype.setLayers=Rv.prototype.g;u("ol.format.OSMXML",Tv,OPENLAYERS);Tv.prototype.readFeatures=Tv.prototype.Ca;Tv.prototype.readProjection=Tv.prototype.Ka;u("ol.format.Polyline",rw,OPENLAYERS);u("ol.format.Polyline.encodeDeltas",sw,OPENLAYERS);u("ol.format.Polyline.decodeDeltas",uw,OPENLAYERS);
u("ol.format.Polyline.encodeFloats",tw,OPENLAYERS);u("ol.format.Polyline.decodeFloats",vw,OPENLAYERS);rw.prototype.readFeature=rw.prototype.Ub;rw.prototype.readFeatures=rw.prototype.Ca;rw.prototype.readGeometry=rw.prototype.Uc;rw.prototype.readProjection=rw.prototype.Ka;rw.prototype.writeGeometry=rw.prototype.Zc;u("ol.format.TopoJSON",ww,OPENLAYERS);ww.prototype.readFeatures=ww.prototype.Ca;ww.prototype.readProjection=ww.prototype.Ka;u("ol.format.WFS",Cw,OPENLAYERS);Cw.prototype.readFeatures=Cw.prototype.Ca;
Cw.prototype.readTransactionResponse=Cw.prototype.j;Cw.prototype.readFeatureCollectionMetadata=Cw.prototype.i;Cw.prototype.writeGetFeature=Cw.prototype.l;Cw.prototype.writeTransaction=Cw.prototype.B;Cw.prototype.readProjection=Cw.prototype.Ka;u("ol.format.WKT",Pw,OPENLAYERS);Pw.prototype.readFeature=Pw.prototype.Ub;Pw.prototype.readFeatures=Pw.prototype.Ca;Pw.prototype.readGeometry=Pw.prototype.Uc;Pw.prototype.writeFeature=Pw.prototype.Ld;Pw.prototype.writeFeatures=Pw.prototype.Wb;
Pw.prototype.writeGeometry=Pw.prototype.Zc;u("ol.format.WMSCapabilities",gx,OPENLAYERS);gx.prototype.read=gx.prototype.read;u("ol.format.WMSGetFeatureInfo",Dx,OPENLAYERS);Dx.prototype.readFeatures=Dx.prototype.Ca;u("ol.format.WMTSCapabilities",Ex,OPENLAYERS);Ex.prototype.read=Ex.prototype.read;u("ol.format.GML2",Ks,OPENLAYERS);u("ol.format.GML3",Ls,OPENLAYERS);Ls.prototype.writeGeometryNode=Ls.prototype.o;Ls.prototype.writeFeatures=Ls.prototype.Wb;Ls.prototype.writeFeaturesNode=Ls.prototype.f;
u("ol.format.GML",Ls,OPENLAYERS);Ls.prototype.writeFeatures=Ls.prototype.Wb;Ls.prototype.writeFeaturesNode=Ls.prototype.f;ys.prototype.readFeatures=ys.prototype.Ca;u("ol.events.condition.altKeyOnly",function(b){b=b.a;return b.f&&!b.l&&!b.c},OPENLAYERS);u("ol.events.condition.altShiftKeysOnly",Qk,OPENLAYERS);u("ol.events.condition.always",se,OPENLAYERS);u("ol.events.condition.click",function(b){return b.type==Nj},OPENLAYERS);u("ol.events.condition.never",re,OPENLAYERS);
u("ol.events.condition.pointerMove",Rk,OPENLAYERS);u("ol.events.condition.singleClick",Sk,OPENLAYERS);u("ol.events.condition.doubleClick",function(b){return b.type==Oj},OPENLAYERS);u("ol.events.condition.noModifierKeys",Tk,OPENLAYERS);u("ol.events.condition.platformModifierKeyOnly",function(b){b=b.a;return!b.f&&b.l&&!b.c},OPENLAYERS);u("ol.events.condition.shiftKeyOnly",Uk,OPENLAYERS);u("ol.events.condition.targetNotEditable",Vk,OPENLAYERS);u("ol.events.condition.mouseOnly",Wk,OPENLAYERS);
u("ol.control.Attribution",Qh,OPENLAYERS);u("ol.control.Attribution.render",Rh,OPENLAYERS);Qh.prototype.getCollapsible=Qh.prototype.Wl;Qh.prototype.setCollapsible=Qh.prototype.Zl;Qh.prototype.setCollapsed=Qh.prototype.Yl;Qh.prototype.getCollapsed=Qh.prototype.Vl;u("ol.control.Control",mh,OPENLAYERS);mh.prototype.getMap=mh.prototype.g;mh.prototype.setMap=mh.prototype.setMap;mh.prototype.setTarget=mh.prototype.c;u("ol.control.defaults",Wh,OPENLAYERS);u("ol.control.FullScreen",bi,OPENLAYERS);
u("ol.control.MousePosition",ci,OPENLAYERS);u("ol.control.MousePosition.render",di,OPENLAYERS);ci.prototype.getCoordinateFormat=ci.prototype.Bg;ci.prototype.getProjection=ci.prototype.hh;ci.prototype.setCoordinateFormat=ci.prototype.bi;ci.prototype.setProjection=ci.prototype.ih;u("ol.control.OverviewMap",sr,OPENLAYERS);u("ol.control.OverviewMap.render",tr,OPENLAYERS);sr.prototype.getCollapsible=sr.prototype.bm;sr.prototype.setCollapsible=sr.prototype.em;sr.prototype.setCollapsed=sr.prototype.dm;
sr.prototype.getCollapsed=sr.prototype.am;sr.prototype.getOverviewMap=sr.prototype.kk;u("ol.control.Rotate",Th,OPENLAYERS);u("ol.control.Rotate.render",Uh,OPENLAYERS);u("ol.control.ScaleLine",xr,OPENLAYERS);xr.prototype.getUnits=xr.prototype.C;u("ol.control.ScaleLine.render",yr,OPENLAYERS);xr.prototype.setUnits=xr.prototype.O;u("ol.control.Zoom",Vh,OPENLAYERS);u("ol.control.ZoomSlider",Lr,OPENLAYERS);u("ol.control.ZoomSlider.render",Nr,OPENLAYERS);u("ol.control.ZoomToExtent",Qr,OPENLAYERS);
u("ol.color.asArray",rg,OPENLAYERS);u("ol.color.asString",tg,OPENLAYERS);fd.prototype.changed=fd.prototype.u;fd.prototype.dispatchEvent=fd.prototype.s;fd.prototype.getRevision=fd.prototype.L;fd.prototype.on=fd.prototype.H;fd.prototype.once=fd.prototype.M;fd.prototype.un=fd.prototype.K;fd.prototype.unByKey=fd.prototype.N;mg.prototype.get=mg.prototype.get;mg.prototype.getKeys=mg.prototype.P;mg.prototype.getProperties=mg.prototype.R;mg.prototype.set=mg.prototype.set;mg.prototype.setProperties=mg.prototype.I;
mg.prototype.unset=mg.prototype.S;mg.prototype.changed=mg.prototype.u;mg.prototype.dispatchEvent=mg.prototype.s;mg.prototype.getRevision=mg.prototype.L;mg.prototype.on=mg.prototype.H;mg.prototype.once=mg.prototype.M;mg.prototype.un=mg.prototype.K;mg.prototype.unByKey=mg.prototype.N;Rr.prototype.get=Rr.prototype.get;Rr.prototype.getKeys=Rr.prototype.P;Rr.prototype.getProperties=Rr.prototype.R;Rr.prototype.set=Rr.prototype.set;Rr.prototype.setProperties=Rr.prototype.I;Rr.prototype.unset=Rr.prototype.S;
Rr.prototype.changed=Rr.prototype.u;Rr.prototype.dispatchEvent=Rr.prototype.s;Rr.prototype.getRevision=Rr.prototype.L;Rr.prototype.on=Rr.prototype.H;Rr.prototype.once=Rr.prototype.M;Rr.prototype.un=Rr.prototype.K;Rr.prototype.unByKey=Rr.prototype.N;un.prototype.get=un.prototype.get;un.prototype.getKeys=un.prototype.P;un.prototype.getProperties=un.prototype.R;un.prototype.set=un.prototype.set;un.prototype.setProperties=un.prototype.I;un.prototype.unset=un.prototype.S;un.prototype.changed=un.prototype.u;
un.prototype.dispatchEvent=un.prototype.s;un.prototype.getRevision=un.prototype.L;un.prototype.on=un.prototype.H;un.prototype.once=un.prototype.M;un.prototype.un=un.prototype.K;un.prototype.unByKey=un.prototype.N;Rx.prototype.get=Rx.prototype.get;Rx.prototype.getKeys=Rx.prototype.P;Rx.prototype.getProperties=Rx.prototype.R;Rx.prototype.set=Rx.prototype.set;Rx.prototype.setProperties=Rx.prototype.I;Rx.prototype.unset=Rx.prototype.S;Rx.prototype.changed=Rx.prototype.u;Rx.prototype.dispatchEvent=Rx.prototype.s;
Rx.prototype.getRevision=Rx.prototype.L;Rx.prototype.on=Rx.prototype.H;Rx.prototype.once=Rx.prototype.M;Rx.prototype.un=Rx.prototype.K;Rx.prototype.unByKey=Rx.prototype.N;cy.prototype.getTileCoord=cy.prototype.c;T.prototype.get=T.prototype.get;T.prototype.getKeys=T.prototype.P;T.prototype.getProperties=T.prototype.R;T.prototype.set=T.prototype.set;T.prototype.setProperties=T.prototype.I;T.prototype.unset=T.prototype.S;T.prototype.changed=T.prototype.u;T.prototype.dispatchEvent=T.prototype.s;
T.prototype.getRevision=T.prototype.L;T.prototype.on=T.prototype.H;T.prototype.once=T.prototype.M;T.prototype.un=T.prototype.K;T.prototype.unByKey=T.prototype.N;Jj.prototype.map=Jj.prototype.map;Jj.prototype.frameState=Jj.prototype.frameState;Kj.prototype.originalEvent=Kj.prototype.originalEvent;Kj.prototype.pixel=Kj.prototype.pixel;Kj.prototype.coordinate=Kj.prototype.coordinate;Kj.prototype.dragging=Kj.prototype.dragging;Kj.prototype.preventDefault=Kj.prototype.preventDefault;
Kj.prototype.stopPropagation=Kj.prototype.b;Kj.prototype.map=Kj.prototype.map;Kj.prototype.frameState=Kj.prototype.frameState;or.prototype.get=or.prototype.get;or.prototype.getKeys=or.prototype.P;or.prototype.getProperties=or.prototype.R;or.prototype.set=or.prototype.set;or.prototype.setProperties=or.prototype.I;or.prototype.unset=or.prototype.S;or.prototype.changed=or.prototype.u;or.prototype.dispatchEvent=or.prototype.s;or.prototype.getRevision=or.prototype.L;or.prototype.on=or.prototype.H;
or.prototype.once=or.prototype.M;or.prototype.un=or.prototype.K;or.prototype.unByKey=or.prototype.N;Go.prototype.getTileCoord=Go.prototype.c;Nf.prototype.get=Nf.prototype.get;Nf.prototype.getKeys=Nf.prototype.P;Nf.prototype.getProperties=Nf.prototype.R;Nf.prototype.set=Nf.prototype.set;Nf.prototype.setProperties=Nf.prototype.I;Nf.prototype.unset=Nf.prototype.S;Nf.prototype.changed=Nf.prototype.u;Nf.prototype.dispatchEvent=Nf.prototype.s;Nf.prototype.getRevision=Nf.prototype.L;Nf.prototype.on=Nf.prototype.H;
Nf.prototype.once=Nf.prototype.M;Nf.prototype.un=Nf.prototype.K;Nf.prototype.unByKey=Nf.prototype.N;HA.prototype.getMaxZoom=HA.prototype.Ig;HA.prototype.getMinZoom=HA.prototype.Jg;HA.prototype.getOrigin=HA.prototype.Ea;HA.prototype.getResolution=HA.prototype.$;HA.prototype.getResolutions=HA.prototype.Fh;HA.prototype.getTileCoordExtent=HA.prototype.Ba;HA.prototype.getTileCoordForCoordAndResolution=HA.prototype.he;HA.prototype.getTileCoordForCoordAndZ=HA.prototype.ie;HA.prototype.getTileSize=HA.prototype.Ma;
cm.prototype.getOpacity=cm.prototype.De;cm.prototype.getRotateWithView=cm.prototype.fe;cm.prototype.getRotation=cm.prototype.Ee;cm.prototype.getScale=cm.prototype.Fe;cm.prototype.getSnapToPixel=cm.prototype.ge;cm.prototype.setOpacity=cm.prototype.Ge;cm.prototype.setRotation=cm.prototype.He;cm.prototype.setScale=cm.prototype.Ie;sk.prototype.getOpacity=sk.prototype.De;sk.prototype.getRotateWithView=sk.prototype.fe;sk.prototype.getRotation=sk.prototype.Ee;sk.prototype.getScale=sk.prototype.Fe;
sk.prototype.getSnapToPixel=sk.prototype.ge;sk.prototype.setOpacity=sk.prototype.Ge;sk.prototype.setRotation=sk.prototype.He;sk.prototype.setScale=sk.prototype.Ie;PA.prototype.getOpacity=PA.prototype.De;PA.prototype.getRotateWithView=PA.prototype.fe;PA.prototype.getRotation=PA.prototype.Ee;PA.prototype.getScale=PA.prototype.Fe;PA.prototype.getSnapToPixel=PA.prototype.ge;PA.prototype.setOpacity=PA.prototype.Ge;PA.prototype.setRotation=PA.prototype.He;PA.prototype.setScale=PA.prototype.Ie;
uh.prototype.get=uh.prototype.get;uh.prototype.getKeys=uh.prototype.P;uh.prototype.getProperties=uh.prototype.R;uh.prototype.set=uh.prototype.set;uh.prototype.setProperties=uh.prototype.I;uh.prototype.unset=uh.prototype.S;uh.prototype.changed=uh.prototype.u;uh.prototype.dispatchEvent=uh.prototype.s;uh.prototype.getRevision=uh.prototype.L;uh.prototype.on=uh.prototype.H;uh.prototype.once=uh.prototype.M;uh.prototype.un=uh.prototype.K;uh.prototype.unByKey=uh.prototype.N;Lh.prototype.getAttributions=Lh.prototype.ta;
Lh.prototype.getLogo=Lh.prototype.ra;Lh.prototype.getProjection=Lh.prototype.ua;Lh.prototype.getState=Lh.prototype.va;Lh.prototype.setAttributions=Lh.prototype.oa;Lh.prototype.get=Lh.prototype.get;Lh.prototype.getKeys=Lh.prototype.P;Lh.prototype.getProperties=Lh.prototype.R;Lh.prototype.set=Lh.prototype.set;Lh.prototype.setProperties=Lh.prototype.I;Lh.prototype.unset=Lh.prototype.S;Lh.prototype.changed=Lh.prototype.u;Lh.prototype.dispatchEvent=Lh.prototype.s;Lh.prototype.getRevision=Lh.prototype.L;
Lh.prototype.on=Lh.prototype.H;Lh.prototype.once=Lh.prototype.M;Lh.prototype.un=Lh.prototype.K;Lh.prototype.unByKey=Lh.prototype.N;aq.prototype.getTileGrid=aq.prototype.Ja;aq.prototype.getAttributions=aq.prototype.ta;aq.prototype.getLogo=aq.prototype.ra;aq.prototype.getProjection=aq.prototype.ua;aq.prototype.getState=aq.prototype.va;aq.prototype.setAttributions=aq.prototype.oa;aq.prototype.get=aq.prototype.get;aq.prototype.getKeys=aq.prototype.P;aq.prototype.getProperties=aq.prototype.R;
aq.prototype.set=aq.prototype.set;aq.prototype.setProperties=aq.prototype.I;aq.prototype.unset=aq.prototype.S;aq.prototype.changed=aq.prototype.u;aq.prototype.dispatchEvent=aq.prototype.s;aq.prototype.getRevision=aq.prototype.L;aq.prototype.on=aq.prototype.H;aq.prototype.once=aq.prototype.M;aq.prototype.un=aq.prototype.K;aq.prototype.unByKey=aq.prototype.N;Y.prototype.getTileLoadFunction=Y.prototype.Za;Y.prototype.getTileUrlFunction=Y.prototype.$a;Y.prototype.getUrls=Y.prototype.ab;
Y.prototype.setTileLoadFunction=Y.prototype.gb;Y.prototype.setTileUrlFunction=Y.prototype.La;Y.prototype.setUrl=Y.prototype.Wa;Y.prototype.setUrls=Y.prototype.Xa;Y.prototype.getTileGrid=Y.prototype.Ja;Y.prototype.getAttributions=Y.prototype.ta;Y.prototype.getLogo=Y.prototype.ra;Y.prototype.getProjection=Y.prototype.ua;Y.prototype.getState=Y.prototype.va;Y.prototype.setAttributions=Y.prototype.oa;Y.prototype.get=Y.prototype.get;Y.prototype.getKeys=Y.prototype.P;Y.prototype.getProperties=Y.prototype.R;
Y.prototype.set=Y.prototype.set;Y.prototype.setProperties=Y.prototype.I;Y.prototype.unset=Y.prototype.S;Y.prototype.changed=Y.prototype.u;Y.prototype.dispatchEvent=Y.prototype.s;Y.prototype.getRevision=Y.prototype.L;Y.prototype.on=Y.prototype.H;Y.prototype.once=Y.prototype.M;Y.prototype.un=Y.prototype.K;Y.prototype.unByKey=Y.prototype.N;Oz.prototype.setRenderReprojectionEdges=Oz.prototype.xb;Oz.prototype.setTileGridForProjection=Oz.prototype.yb;Oz.prototype.getTileLoadFunction=Oz.prototype.Za;
Oz.prototype.getTileUrlFunction=Oz.prototype.$a;Oz.prototype.getUrls=Oz.prototype.ab;Oz.prototype.setTileLoadFunction=Oz.prototype.gb;Oz.prototype.setTileUrlFunction=Oz.prototype.La;Oz.prototype.setUrl=Oz.prototype.Wa;Oz.prototype.setUrls=Oz.prototype.Xa;Oz.prototype.getTileGrid=Oz.prototype.Ja;Oz.prototype.getAttributions=Oz.prototype.ta;Oz.prototype.getLogo=Oz.prototype.ra;Oz.prototype.getProjection=Oz.prototype.ua;Oz.prototype.getState=Oz.prototype.va;Oz.prototype.setAttributions=Oz.prototype.oa;
Oz.prototype.get=Oz.prototype.get;Oz.prototype.getKeys=Oz.prototype.P;Oz.prototype.getProperties=Oz.prototype.R;Oz.prototype.set=Oz.prototype.set;Oz.prototype.setProperties=Oz.prototype.I;Oz.prototype.unset=Oz.prototype.S;Oz.prototype.changed=Oz.prototype.u;Oz.prototype.dispatchEvent=Oz.prototype.s;Oz.prototype.getRevision=Oz.prototype.L;Oz.prototype.on=Oz.prototype.H;Oz.prototype.once=Oz.prototype.M;Oz.prototype.un=Oz.prototype.K;Oz.prototype.unByKey=Oz.prototype.N;Jp.prototype.getAttributions=Jp.prototype.ta;
Jp.prototype.getLogo=Jp.prototype.ra;Jp.prototype.getProjection=Jp.prototype.ua;Jp.prototype.getState=Jp.prototype.va;Jp.prototype.setAttributions=Jp.prototype.oa;Jp.prototype.get=Jp.prototype.get;Jp.prototype.getKeys=Jp.prototype.P;Jp.prototype.getProperties=Jp.prototype.R;Jp.prototype.set=Jp.prototype.set;Jp.prototype.setProperties=Jp.prototype.I;Jp.prototype.unset=Jp.prototype.S;Jp.prototype.changed=Jp.prototype.u;Jp.prototype.dispatchEvent=Jp.prototype.s;Jp.prototype.getRevision=Jp.prototype.L;
Jp.prototype.on=Jp.prototype.H;Jp.prototype.once=Jp.prototype.M;Jp.prototype.un=Jp.prototype.K;Jp.prototype.unByKey=Jp.prototype.N;Qz.prototype.addFeature=Qz.prototype.Dd;Qz.prototype.addFeatures=Qz.prototype.Ic;Qz.prototype.clear=Qz.prototype.clear;Qz.prototype.forEachFeature=Qz.prototype.wg;Qz.prototype.forEachFeatureInExtent=Qz.prototype.rb;Qz.prototype.forEachFeatureIntersectingExtent=Qz.prototype.xg;Qz.prototype.getFeaturesCollection=Qz.prototype.Eg;Qz.prototype.getFeatures=Qz.prototype.Be;
Qz.prototype.getFeaturesAtCoordinate=Qz.prototype.Dg;Qz.prototype.getFeaturesInExtent=Qz.prototype.pf;Qz.prototype.getClosestFeatureToCoordinate=Qz.prototype.zg;Qz.prototype.getExtent=Qz.prototype.J;Qz.prototype.getFeatureById=Qz.prototype.Cg;Qz.prototype.removeFeature=Qz.prototype.Sc;Qz.prototype.getAttributions=Qz.prototype.ta;Qz.prototype.getLogo=Qz.prototype.ra;Qz.prototype.getProjection=Qz.prototype.ua;Qz.prototype.getState=Qz.prototype.va;Qz.prototype.setAttributions=Qz.prototype.oa;
Qz.prototype.get=Qz.prototype.get;Qz.prototype.getKeys=Qz.prototype.P;Qz.prototype.getProperties=Qz.prototype.R;Qz.prototype.set=Qz.prototype.set;Qz.prototype.setProperties=Qz.prototype.I;Qz.prototype.unset=Qz.prototype.S;Qz.prototype.changed=Qz.prototype.u;Qz.prototype.dispatchEvent=Qz.prototype.s;Qz.prototype.getRevision=Qz.prototype.L;Qz.prototype.on=Qz.prototype.H;Qz.prototype.once=Qz.prototype.M;Qz.prototype.un=Qz.prototype.K;Qz.prototype.unByKey=Qz.prototype.N;mn.prototype.getAttributions=mn.prototype.ta;
mn.prototype.getLogo=mn.prototype.ra;mn.prototype.getProjection=mn.prototype.ua;mn.prototype.getState=mn.prototype.va;mn.prototype.setAttributions=mn.prototype.oa;mn.prototype.get=mn.prototype.get;mn.prototype.getKeys=mn.prototype.P;mn.prototype.getProperties=mn.prototype.R;mn.prototype.set=mn.prototype.set;mn.prototype.setProperties=mn.prototype.I;mn.prototype.unset=mn.prototype.S;mn.prototype.changed=mn.prototype.u;mn.prototype.dispatchEvent=mn.prototype.s;mn.prototype.getRevision=mn.prototype.L;
mn.prototype.on=mn.prototype.H;mn.prototype.once=mn.prototype.M;mn.prototype.un=mn.prototype.K;mn.prototype.unByKey=mn.prototype.N;tn.prototype.getAttributions=tn.prototype.ta;tn.prototype.getLogo=tn.prototype.ra;tn.prototype.getProjection=tn.prototype.ua;tn.prototype.getState=tn.prototype.va;tn.prototype.setAttributions=tn.prototype.oa;tn.prototype.get=tn.prototype.get;tn.prototype.getKeys=tn.prototype.P;tn.prototype.getProperties=tn.prototype.R;tn.prototype.set=tn.prototype.set;
tn.prototype.setProperties=tn.prototype.I;tn.prototype.unset=tn.prototype.S;tn.prototype.changed=tn.prototype.u;tn.prototype.dispatchEvent=tn.prototype.s;tn.prototype.getRevision=tn.prototype.L;tn.prototype.on=tn.prototype.H;tn.prototype.once=tn.prototype.M;tn.prototype.un=tn.prototype.K;tn.prototype.unByKey=tn.prototype.N;Tz.prototype.getAttributions=Tz.prototype.ta;Tz.prototype.getLogo=Tz.prototype.ra;Tz.prototype.getProjection=Tz.prototype.ua;Tz.prototype.getState=Tz.prototype.va;
Tz.prototype.setAttributions=Tz.prototype.oa;Tz.prototype.get=Tz.prototype.get;Tz.prototype.getKeys=Tz.prototype.P;Tz.prototype.getProperties=Tz.prototype.R;Tz.prototype.set=Tz.prototype.set;Tz.prototype.setProperties=Tz.prototype.I;Tz.prototype.unset=Tz.prototype.S;Tz.prototype.changed=Tz.prototype.u;Tz.prototype.dispatchEvent=Tz.prototype.s;Tz.prototype.getRevision=Tz.prototype.L;Tz.prototype.on=Tz.prototype.H;Tz.prototype.once=Tz.prototype.M;Tz.prototype.un=Tz.prototype.K;
Tz.prototype.unByKey=Tz.prototype.N;Uz.prototype.getAttributions=Uz.prototype.ta;Uz.prototype.getLogo=Uz.prototype.ra;Uz.prototype.getProjection=Uz.prototype.ua;Uz.prototype.getState=Uz.prototype.va;Uz.prototype.setAttributions=Uz.prototype.oa;Uz.prototype.get=Uz.prototype.get;Uz.prototype.getKeys=Uz.prototype.P;Uz.prototype.getProperties=Uz.prototype.R;Uz.prototype.set=Uz.prototype.set;Uz.prototype.setProperties=Uz.prototype.I;Uz.prototype.unset=Uz.prototype.S;Uz.prototype.changed=Uz.prototype.u;
Uz.prototype.dispatchEvent=Uz.prototype.s;Uz.prototype.getRevision=Uz.prototype.L;Uz.prototype.on=Uz.prototype.H;Uz.prototype.once=Uz.prototype.M;Uz.prototype.un=Uz.prototype.K;Uz.prototype.unByKey=Uz.prototype.N;Rp.prototype.getAttributions=Rp.prototype.ta;Rp.prototype.getLogo=Rp.prototype.ra;Rp.prototype.getProjection=Rp.prototype.ua;Rp.prototype.getState=Rp.prototype.va;Rp.prototype.setAttributions=Rp.prototype.oa;Rp.prototype.get=Rp.prototype.get;Rp.prototype.getKeys=Rp.prototype.P;
Rp.prototype.getProperties=Rp.prototype.R;Rp.prototype.set=Rp.prototype.set;Rp.prototype.setProperties=Rp.prototype.I;Rp.prototype.unset=Rp.prototype.S;Rp.prototype.changed=Rp.prototype.u;Rp.prototype.dispatchEvent=Rp.prototype.s;Rp.prototype.getRevision=Rp.prototype.L;Rp.prototype.on=Rp.prototype.H;Rp.prototype.once=Rp.prototype.M;Rp.prototype.un=Rp.prototype.K;Rp.prototype.unByKey=Rp.prototype.N;Vz.prototype.getAttributions=Vz.prototype.ta;Vz.prototype.getLogo=Vz.prototype.ra;
Vz.prototype.getProjection=Vz.prototype.ua;Vz.prototype.getState=Vz.prototype.va;Vz.prototype.setAttributions=Vz.prototype.oa;Vz.prototype.get=Vz.prototype.get;Vz.prototype.getKeys=Vz.prototype.P;Vz.prototype.getProperties=Vz.prototype.R;Vz.prototype.set=Vz.prototype.set;Vz.prototype.setProperties=Vz.prototype.I;Vz.prototype.unset=Vz.prototype.S;Vz.prototype.changed=Vz.prototype.u;Vz.prototype.dispatchEvent=Vz.prototype.s;Vz.prototype.getRevision=Vz.prototype.L;Vz.prototype.on=Vz.prototype.H;
Vz.prototype.once=Vz.prototype.M;Vz.prototype.un=Vz.prototype.K;Vz.prototype.unByKey=Vz.prototype.N;Zz.prototype.setRenderReprojectionEdges=Zz.prototype.xb;Zz.prototype.setTileGridForProjection=Zz.prototype.yb;Zz.prototype.getTileLoadFunction=Zz.prototype.Za;Zz.prototype.getTileUrlFunction=Zz.prototype.$a;Zz.prototype.getUrls=Zz.prototype.ab;Zz.prototype.setTileLoadFunction=Zz.prototype.gb;Zz.prototype.setTileUrlFunction=Zz.prototype.La;Zz.prototype.setUrl=Zz.prototype.Wa;Zz.prototype.setUrls=Zz.prototype.Xa;
Zz.prototype.getTileGrid=Zz.prototype.Ja;Zz.prototype.getAttributions=Zz.prototype.ta;Zz.prototype.getLogo=Zz.prototype.ra;Zz.prototype.getProjection=Zz.prototype.ua;Zz.prototype.getState=Zz.prototype.va;Zz.prototype.setAttributions=Zz.prototype.oa;Zz.prototype.get=Zz.prototype.get;Zz.prototype.getKeys=Zz.prototype.P;Zz.prototype.getProperties=Zz.prototype.R;Zz.prototype.set=Zz.prototype.set;Zz.prototype.setProperties=Zz.prototype.I;Zz.prototype.unset=Zz.prototype.S;Zz.prototype.changed=Zz.prototype.u;
Zz.prototype.dispatchEvent=Zz.prototype.s;Zz.prototype.getRevision=Zz.prototype.L;Zz.prototype.on=Zz.prototype.H;Zz.prototype.once=Zz.prototype.M;Zz.prototype.un=Zz.prototype.K;Zz.prototype.unByKey=Zz.prototype.N;bA.prototype.setRenderReprojectionEdges=bA.prototype.xb;bA.prototype.setTileGridForProjection=bA.prototype.yb;bA.prototype.getTileLoadFunction=bA.prototype.Za;bA.prototype.getTileUrlFunction=bA.prototype.$a;bA.prototype.getUrls=bA.prototype.ab;bA.prototype.setTileLoadFunction=bA.prototype.gb;
bA.prototype.setTileUrlFunction=bA.prototype.La;bA.prototype.setUrl=bA.prototype.Wa;bA.prototype.setUrls=bA.prototype.Xa;bA.prototype.getTileGrid=bA.prototype.Ja;bA.prototype.getAttributions=bA.prototype.ta;bA.prototype.getLogo=bA.prototype.ra;bA.prototype.getProjection=bA.prototype.ua;bA.prototype.getState=bA.prototype.va;bA.prototype.setAttributions=bA.prototype.oa;bA.prototype.get=bA.prototype.get;bA.prototype.getKeys=bA.prototype.P;bA.prototype.getProperties=bA.prototype.R;bA.prototype.set=bA.prototype.set;
bA.prototype.setProperties=bA.prototype.I;bA.prototype.unset=bA.prototype.S;bA.prototype.changed=bA.prototype.u;bA.prototype.dispatchEvent=bA.prototype.s;bA.prototype.getRevision=bA.prototype.L;bA.prototype.on=bA.prototype.H;bA.prototype.once=bA.prototype.M;bA.prototype.un=bA.prototype.K;bA.prototype.unByKey=bA.prototype.N;$z.prototype.setRenderReprojectionEdges=$z.prototype.xb;$z.prototype.setTileGridForProjection=$z.prototype.yb;$z.prototype.getTileLoadFunction=$z.prototype.Za;
$z.prototype.getTileUrlFunction=$z.prototype.$a;$z.prototype.getUrls=$z.prototype.ab;$z.prototype.setTileLoadFunction=$z.prototype.gb;$z.prototype.setTileUrlFunction=$z.prototype.La;$z.prototype.setUrl=$z.prototype.Wa;$z.prototype.setUrls=$z.prototype.Xa;$z.prototype.getTileGrid=$z.prototype.Ja;$z.prototype.getAttributions=$z.prototype.ta;$z.prototype.getLogo=$z.prototype.ra;$z.prototype.getProjection=$z.prototype.ua;$z.prototype.getState=$z.prototype.va;$z.prototype.setAttributions=$z.prototype.oa;
$z.prototype.get=$z.prototype.get;$z.prototype.getKeys=$z.prototype.P;$z.prototype.getProperties=$z.prototype.R;$z.prototype.set=$z.prototype.set;$z.prototype.setProperties=$z.prototype.I;$z.prototype.unset=$z.prototype.S;$z.prototype.changed=$z.prototype.u;$z.prototype.dispatchEvent=$z.prototype.s;$z.prototype.getRevision=$z.prototype.L;$z.prototype.on=$z.prototype.H;$z.prototype.once=$z.prototype.M;$z.prototype.un=$z.prototype.K;$z.prototype.unByKey=$z.prototype.N;eA.prototype.getAttributions=eA.prototype.ta;
eA.prototype.getLogo=eA.prototype.ra;eA.prototype.getProjection=eA.prototype.ua;eA.prototype.getState=eA.prototype.va;eA.prototype.setAttributions=eA.prototype.oa;eA.prototype.get=eA.prototype.get;eA.prototype.getKeys=eA.prototype.P;eA.prototype.getProperties=eA.prototype.R;eA.prototype.set=eA.prototype.set;eA.prototype.setProperties=eA.prototype.I;eA.prototype.unset=eA.prototype.S;eA.prototype.changed=eA.prototype.u;eA.prototype.dispatchEvent=eA.prototype.s;eA.prototype.getRevision=eA.prototype.L;
eA.prototype.on=eA.prototype.H;eA.prototype.once=eA.prototype.M;eA.prototype.un=eA.prototype.K;eA.prototype.unByKey=eA.prototype.N;oA.prototype.setRenderReprojectionEdges=oA.prototype.xb;oA.prototype.setTileGridForProjection=oA.prototype.yb;oA.prototype.getTileLoadFunction=oA.prototype.Za;oA.prototype.getTileUrlFunction=oA.prototype.$a;oA.prototype.getUrls=oA.prototype.ab;oA.prototype.setTileLoadFunction=oA.prototype.gb;oA.prototype.setTileUrlFunction=oA.prototype.La;oA.prototype.setUrl=oA.prototype.Wa;
oA.prototype.setUrls=oA.prototype.Xa;oA.prototype.getTileGrid=oA.prototype.Ja;oA.prototype.getAttributions=oA.prototype.ta;oA.prototype.getLogo=oA.prototype.ra;oA.prototype.getProjection=oA.prototype.ua;oA.prototype.getState=oA.prototype.va;oA.prototype.setAttributions=oA.prototype.oa;oA.prototype.get=oA.prototype.get;oA.prototype.getKeys=oA.prototype.P;oA.prototype.getProperties=oA.prototype.R;oA.prototype.set=oA.prototype.set;oA.prototype.setProperties=oA.prototype.I;oA.prototype.unset=oA.prototype.S;
oA.prototype.changed=oA.prototype.u;oA.prototype.dispatchEvent=oA.prototype.s;oA.prototype.getRevision=oA.prototype.L;oA.prototype.on=oA.prototype.H;oA.prototype.once=oA.prototype.M;oA.prototype.un=oA.prototype.K;oA.prototype.unByKey=oA.prototype.N;qA.prototype.setRenderReprojectionEdges=qA.prototype.xb;qA.prototype.setTileGridForProjection=qA.prototype.yb;qA.prototype.getTileLoadFunction=qA.prototype.Za;qA.prototype.getTileUrlFunction=qA.prototype.$a;qA.prototype.getUrls=qA.prototype.ab;
qA.prototype.setTileLoadFunction=qA.prototype.gb;qA.prototype.setTileUrlFunction=qA.prototype.La;qA.prototype.setUrl=qA.prototype.Wa;qA.prototype.setUrls=qA.prototype.Xa;qA.prototype.getTileGrid=qA.prototype.Ja;qA.prototype.getAttributions=qA.prototype.ta;qA.prototype.getLogo=qA.prototype.ra;qA.prototype.getProjection=qA.prototype.ua;qA.prototype.getState=qA.prototype.va;qA.prototype.setAttributions=qA.prototype.oa;qA.prototype.get=qA.prototype.get;qA.prototype.getKeys=qA.prototype.P;
qA.prototype.getProperties=qA.prototype.R;qA.prototype.set=qA.prototype.set;qA.prototype.setProperties=qA.prototype.I;qA.prototype.unset=qA.prototype.S;qA.prototype.changed=qA.prototype.u;qA.prototype.dispatchEvent=qA.prototype.s;qA.prototype.getRevision=qA.prototype.L;qA.prototype.on=qA.prototype.H;qA.prototype.once=qA.prototype.M;qA.prototype.un=qA.prototype.K;qA.prototype.unByKey=qA.prototype.N;sA.prototype.getTileGrid=sA.prototype.Ja;sA.prototype.getAttributions=sA.prototype.ta;
sA.prototype.getLogo=sA.prototype.ra;sA.prototype.getProjection=sA.prototype.ua;sA.prototype.getState=sA.prototype.va;sA.prototype.setAttributions=sA.prototype.oa;sA.prototype.get=sA.prototype.get;sA.prototype.getKeys=sA.prototype.P;sA.prototype.getProperties=sA.prototype.R;sA.prototype.set=sA.prototype.set;sA.prototype.setProperties=sA.prototype.I;sA.prototype.unset=sA.prototype.S;sA.prototype.changed=sA.prototype.u;sA.prototype.dispatchEvent=sA.prototype.s;sA.prototype.getRevision=sA.prototype.L;
sA.prototype.on=sA.prototype.H;sA.prototype.once=sA.prototype.M;sA.prototype.un=sA.prototype.K;sA.prototype.unByKey=sA.prototype.N;wA.prototype.setRenderReprojectionEdges=wA.prototype.xb;wA.prototype.setTileGridForProjection=wA.prototype.yb;wA.prototype.getTileLoadFunction=wA.prototype.Za;wA.prototype.getTileUrlFunction=wA.prototype.$a;wA.prototype.getUrls=wA.prototype.ab;wA.prototype.setTileLoadFunction=wA.prototype.gb;wA.prototype.setTileUrlFunction=wA.prototype.La;wA.prototype.setUrl=wA.prototype.Wa;
wA.prototype.setUrls=wA.prototype.Xa;wA.prototype.getTileGrid=wA.prototype.Ja;wA.prototype.getAttributions=wA.prototype.ta;wA.prototype.getLogo=wA.prototype.ra;wA.prototype.getProjection=wA.prototype.ua;wA.prototype.getState=wA.prototype.va;wA.prototype.setAttributions=wA.prototype.oa;wA.prototype.get=wA.prototype.get;wA.prototype.getKeys=wA.prototype.P;wA.prototype.getProperties=wA.prototype.R;wA.prototype.set=wA.prototype.set;wA.prototype.setProperties=wA.prototype.I;wA.prototype.unset=wA.prototype.S;
wA.prototype.changed=wA.prototype.u;wA.prototype.dispatchEvent=wA.prototype.s;wA.prototype.getRevision=wA.prototype.L;wA.prototype.on=wA.prototype.H;wA.prototype.once=wA.prototype.M;wA.prototype.un=wA.prototype.K;wA.prototype.unByKey=wA.prototype.N;xA.prototype.getTileGrid=xA.prototype.Ja;xA.prototype.getAttributions=xA.prototype.ta;xA.prototype.getLogo=xA.prototype.ra;xA.prototype.getProjection=xA.prototype.ua;xA.prototype.getState=xA.prototype.va;xA.prototype.setAttributions=xA.prototype.oa;
xA.prototype.get=xA.prototype.get;xA.prototype.getKeys=xA.prototype.P;xA.prototype.getProperties=xA.prototype.R;xA.prototype.set=xA.prototype.set;xA.prototype.setProperties=xA.prototype.I;xA.prototype.unset=xA.prototype.S;xA.prototype.changed=xA.prototype.u;xA.prototype.dispatchEvent=xA.prototype.s;xA.prototype.getRevision=xA.prototype.L;xA.prototype.on=xA.prototype.H;xA.prototype.once=xA.prototype.M;xA.prototype.un=xA.prototype.K;xA.prototype.unByKey=xA.prototype.N;
CA.prototype.setRenderReprojectionEdges=CA.prototype.xb;CA.prototype.setTileGridForProjection=CA.prototype.yb;CA.prototype.getTileLoadFunction=CA.prototype.Za;CA.prototype.getTileUrlFunction=CA.prototype.$a;CA.prototype.getUrls=CA.prototype.ab;CA.prototype.setTileLoadFunction=CA.prototype.gb;CA.prototype.setTileUrlFunction=CA.prototype.La;CA.prototype.setUrl=CA.prototype.Wa;CA.prototype.setUrls=CA.prototype.Xa;CA.prototype.getTileGrid=CA.prototype.Ja;CA.prototype.getAttributions=CA.prototype.ta;
CA.prototype.getLogo=CA.prototype.ra;CA.prototype.getProjection=CA.prototype.ua;CA.prototype.getState=CA.prototype.va;CA.prototype.setAttributions=CA.prototype.oa;CA.prototype.get=CA.prototype.get;CA.prototype.getKeys=CA.prototype.P;CA.prototype.getProperties=CA.prototype.R;CA.prototype.set=CA.prototype.set;CA.prototype.setProperties=CA.prototype.I;CA.prototype.unset=CA.prototype.S;CA.prototype.changed=CA.prototype.u;CA.prototype.dispatchEvent=CA.prototype.s;CA.prototype.getRevision=CA.prototype.L;
CA.prototype.on=CA.prototype.H;CA.prototype.once=CA.prototype.M;CA.prototype.un=CA.prototype.K;CA.prototype.unByKey=CA.prototype.N;bq.prototype.getTileLoadFunction=bq.prototype.Za;bq.prototype.getTileUrlFunction=bq.prototype.$a;bq.prototype.getUrls=bq.prototype.ab;bq.prototype.setTileLoadFunction=bq.prototype.gb;bq.prototype.setTileUrlFunction=bq.prototype.La;bq.prototype.setUrl=bq.prototype.Wa;bq.prototype.setUrls=bq.prototype.Xa;bq.prototype.getTileGrid=bq.prototype.Ja;
bq.prototype.getAttributions=bq.prototype.ta;bq.prototype.getLogo=bq.prototype.ra;bq.prototype.getProjection=bq.prototype.ua;bq.prototype.getState=bq.prototype.va;bq.prototype.setAttributions=bq.prototype.oa;bq.prototype.get=bq.prototype.get;bq.prototype.getKeys=bq.prototype.P;bq.prototype.getProperties=bq.prototype.R;bq.prototype.set=bq.prototype.set;bq.prototype.setProperties=bq.prototype.I;bq.prototype.unset=bq.prototype.S;bq.prototype.changed=bq.prototype.u;bq.prototype.dispatchEvent=bq.prototype.s;
bq.prototype.getRevision=bq.prototype.L;bq.prototype.on=bq.prototype.H;bq.prototype.once=bq.prototype.M;bq.prototype.un=bq.prototype.K;bq.prototype.unByKey=bq.prototype.N;Z.prototype.setRenderReprojectionEdges=Z.prototype.xb;Z.prototype.setTileGridForProjection=Z.prototype.yb;Z.prototype.getTileLoadFunction=Z.prototype.Za;Z.prototype.getTileUrlFunction=Z.prototype.$a;Z.prototype.getUrls=Z.prototype.ab;Z.prototype.setTileLoadFunction=Z.prototype.gb;Z.prototype.setTileUrlFunction=Z.prototype.La;
Z.prototype.setUrl=Z.prototype.Wa;Z.prototype.setUrls=Z.prototype.Xa;Z.prototype.getTileGrid=Z.prototype.Ja;Z.prototype.getAttributions=Z.prototype.ta;Z.prototype.getLogo=Z.prototype.ra;Z.prototype.getProjection=Z.prototype.ua;Z.prototype.getState=Z.prototype.va;Z.prototype.setAttributions=Z.prototype.oa;Z.prototype.get=Z.prototype.get;Z.prototype.getKeys=Z.prototype.P;Z.prototype.getProperties=Z.prototype.R;Z.prototype.set=Z.prototype.set;Z.prototype.setProperties=Z.prototype.I;
Z.prototype.unset=Z.prototype.S;Z.prototype.changed=Z.prototype.u;Z.prototype.dispatchEvent=Z.prototype.s;Z.prototype.getRevision=Z.prototype.L;Z.prototype.on=Z.prototype.H;Z.prototype.once=Z.prototype.M;Z.prototype.un=Z.prototype.K;Z.prototype.unByKey=Z.prototype.N;KA.prototype.setRenderReprojectionEdges=KA.prototype.xb;KA.prototype.setTileGridForProjection=KA.prototype.yb;KA.prototype.getTileLoadFunction=KA.prototype.Za;KA.prototype.getTileUrlFunction=KA.prototype.$a;KA.prototype.getUrls=KA.prototype.ab;
KA.prototype.setTileLoadFunction=KA.prototype.gb;KA.prototype.setTileUrlFunction=KA.prototype.La;KA.prototype.setUrl=KA.prototype.Wa;KA.prototype.setUrls=KA.prototype.Xa;KA.prototype.getTileGrid=KA.prototype.Ja;KA.prototype.getAttributions=KA.prototype.ta;KA.prototype.getLogo=KA.prototype.ra;KA.prototype.getProjection=KA.prototype.ua;KA.prototype.getState=KA.prototype.va;KA.prototype.setAttributions=KA.prototype.oa;KA.prototype.get=KA.prototype.get;KA.prototype.getKeys=KA.prototype.P;
KA.prototype.getProperties=KA.prototype.R;KA.prototype.set=KA.prototype.set;KA.prototype.setProperties=KA.prototype.I;KA.prototype.unset=KA.prototype.S;KA.prototype.changed=KA.prototype.u;KA.prototype.dispatchEvent=KA.prototype.s;KA.prototype.getRevision=KA.prototype.L;KA.prototype.on=KA.prototype.H;KA.prototype.once=KA.prototype.M;KA.prototype.un=KA.prototype.K;KA.prototype.unByKey=KA.prototype.N;xz.prototype.getTileCoord=xz.prototype.c;ik.prototype.changed=ik.prototype.u;
ik.prototype.dispatchEvent=ik.prototype.s;ik.prototype.getRevision=ik.prototype.L;ik.prototype.on=ik.prototype.H;ik.prototype.once=ik.prototype.M;ik.prototype.un=ik.prototype.K;ik.prototype.unByKey=ik.prototype.N;Yq.prototype.changed=Yq.prototype.u;Yq.prototype.dispatchEvent=Yq.prototype.s;Yq.prototype.getRevision=Yq.prototype.L;Yq.prototype.on=Yq.prototype.H;Yq.prototype.once=Yq.prototype.M;Yq.prototype.un=Yq.prototype.K;Yq.prototype.unByKey=Yq.prototype.N;ar.prototype.changed=ar.prototype.u;
ar.prototype.dispatchEvent=ar.prototype.s;ar.prototype.getRevision=ar.prototype.L;ar.prototype.on=ar.prototype.H;ar.prototype.once=ar.prototype.M;ar.prototype.un=ar.prototype.K;ar.prototype.unByKey=ar.prototype.N;gr.prototype.changed=gr.prototype.u;gr.prototype.dispatchEvent=gr.prototype.s;gr.prototype.getRevision=gr.prototype.L;gr.prototype.on=gr.prototype.H;gr.prototype.once=gr.prototype.M;gr.prototype.un=gr.prototype.K;gr.prototype.unByKey=gr.prototype.N;ir.prototype.changed=ir.prototype.u;
ir.prototype.dispatchEvent=ir.prototype.s;ir.prototype.getRevision=ir.prototype.L;ir.prototype.on=ir.prototype.H;ir.prototype.once=ir.prototype.M;ir.prototype.un=ir.prototype.K;ir.prototype.unByKey=ir.prototype.N;hq.prototype.changed=hq.prototype.u;hq.prototype.dispatchEvent=hq.prototype.s;hq.prototype.getRevision=hq.prototype.L;hq.prototype.on=hq.prototype.H;hq.prototype.once=hq.prototype.M;hq.prototype.un=hq.prototype.K;hq.prototype.unByKey=hq.prototype.N;iq.prototype.changed=iq.prototype.u;
iq.prototype.dispatchEvent=iq.prototype.s;iq.prototype.getRevision=iq.prototype.L;iq.prototype.on=iq.prototype.H;iq.prototype.once=iq.prototype.M;iq.prototype.un=iq.prototype.K;iq.prototype.unByKey=iq.prototype.N;jq.prototype.changed=jq.prototype.u;jq.prototype.dispatchEvent=jq.prototype.s;jq.prototype.getRevision=jq.prototype.L;jq.prototype.on=jq.prototype.H;jq.prototype.once=jq.prototype.M;jq.prototype.un=jq.prototype.K;jq.prototype.unByKey=jq.prototype.N;lq.prototype.changed=lq.prototype.u;
lq.prototype.dispatchEvent=lq.prototype.s;lq.prototype.getRevision=lq.prototype.L;lq.prototype.on=lq.prototype.H;lq.prototype.once=lq.prototype.M;lq.prototype.un=lq.prototype.K;lq.prototype.unByKey=lq.prototype.N;zm.prototype.changed=zm.prototype.u;zm.prototype.dispatchEvent=zm.prototype.s;zm.prototype.getRevision=zm.prototype.L;zm.prototype.on=zm.prototype.H;zm.prototype.once=zm.prototype.M;zm.prototype.un=zm.prototype.K;zm.prototype.unByKey=zm.prototype.N;Tp.prototype.changed=Tp.prototype.u;
Tp.prototype.dispatchEvent=Tp.prototype.s;Tp.prototype.getRevision=Tp.prototype.L;Tp.prototype.on=Tp.prototype.H;Tp.prototype.once=Tp.prototype.M;Tp.prototype.un=Tp.prototype.K;Tp.prototype.unByKey=Tp.prototype.N;Up.prototype.changed=Up.prototype.u;Up.prototype.dispatchEvent=Up.prototype.s;Up.prototype.getRevision=Up.prototype.L;Up.prototype.on=Up.prototype.H;Up.prototype.once=Up.prototype.M;Up.prototype.un=Up.prototype.K;Up.prototype.unByKey=Up.prototype.N;Vp.prototype.changed=Vp.prototype.u;
Vp.prototype.dispatchEvent=Vp.prototype.s;Vp.prototype.getRevision=Vp.prototype.L;Vp.prototype.on=Vp.prototype.H;Vp.prototype.once=Vp.prototype.M;Vp.prototype.un=Vp.prototype.K;Vp.prototype.unByKey=Vp.prototype.N;dq.prototype.changed=dq.prototype.u;dq.prototype.dispatchEvent=dq.prototype.s;dq.prototype.getRevision=dq.prototype.L;dq.prototype.on=dq.prototype.H;dq.prototype.once=dq.prototype.M;dq.prototype.un=dq.prototype.K;dq.prototype.unByKey=dq.prototype.N;Xj.prototype.get=Xj.prototype.get;
Xj.prototype.getKeys=Xj.prototype.P;Xj.prototype.getProperties=Xj.prototype.R;Xj.prototype.set=Xj.prototype.set;Xj.prototype.setProperties=Xj.prototype.I;Xj.prototype.unset=Xj.prototype.S;Xj.prototype.changed=Xj.prototype.u;Xj.prototype.dispatchEvent=Xj.prototype.s;Xj.prototype.getRevision=Xj.prototype.L;Xj.prototype.on=Xj.prototype.H;Xj.prototype.once=Xj.prototype.M;Xj.prototype.un=Xj.prototype.K;Xj.prototype.unByKey=Xj.prototype.N;bk.prototype.getExtent=bk.prototype.J;
bk.prototype.getMaxResolution=bk.prototype.Ob;bk.prototype.getMinResolution=bk.prototype.Pb;bk.prototype.getOpacity=bk.prototype.Sb;bk.prototype.getVisible=bk.prototype.tb;bk.prototype.getZIndex=bk.prototype.Tb;bk.prototype.setExtent=bk.prototype.dc;bk.prototype.setMaxResolution=bk.prototype.lc;bk.prototype.setMinResolution=bk.prototype.mc;bk.prototype.setOpacity=bk.prototype.ec;bk.prototype.setVisible=bk.prototype.fc;bk.prototype.setZIndex=bk.prototype.gc;bk.prototype.get=bk.prototype.get;
bk.prototype.getKeys=bk.prototype.P;bk.prototype.getProperties=bk.prototype.R;bk.prototype.set=bk.prototype.set;bk.prototype.setProperties=bk.prototype.I;bk.prototype.unset=bk.prototype.S;bk.prototype.changed=bk.prototype.u;bk.prototype.dispatchEvent=bk.prototype.s;bk.prototype.getRevision=bk.prototype.L;bk.prototype.on=bk.prototype.H;bk.prototype.once=bk.prototype.M;bk.prototype.un=bk.prototype.K;bk.prototype.unByKey=bk.prototype.N;J.prototype.setMap=J.prototype.setMap;J.prototype.setSource=J.prototype.Dc;
J.prototype.getExtent=J.prototype.J;J.prototype.getMaxResolution=J.prototype.Ob;J.prototype.getMinResolution=J.prototype.Pb;J.prototype.getOpacity=J.prototype.Sb;J.prototype.getVisible=J.prototype.tb;J.prototype.getZIndex=J.prototype.Tb;J.prototype.setExtent=J.prototype.dc;J.prototype.setMaxResolution=J.prototype.lc;J.prototype.setMinResolution=J.prototype.mc;J.prototype.setOpacity=J.prototype.ec;J.prototype.setVisible=J.prototype.fc;J.prototype.setZIndex=J.prototype.gc;J.prototype.get=J.prototype.get;
J.prototype.getKeys=J.prototype.P;J.prototype.getProperties=J.prototype.R;J.prototype.set=J.prototype.set;J.prototype.setProperties=J.prototype.I;J.prototype.unset=J.prototype.S;J.prototype.changed=J.prototype.u;J.prototype.dispatchEvent=J.prototype.s;J.prototype.getRevision=J.prototype.L;J.prototype.on=J.prototype.H;J.prototype.once=J.prototype.M;J.prototype.un=J.prototype.K;J.prototype.unByKey=J.prototype.N;X.prototype.getSource=X.prototype.ea;X.prototype.getStyle=X.prototype.C;
X.prototype.getStyleFunction=X.prototype.D;X.prototype.setStyle=X.prototype.c;X.prototype.setMap=X.prototype.setMap;X.prototype.setSource=X.prototype.Dc;X.prototype.getExtent=X.prototype.J;X.prototype.getMaxResolution=X.prototype.Ob;X.prototype.getMinResolution=X.prototype.Pb;X.prototype.getOpacity=X.prototype.Sb;X.prototype.getVisible=X.prototype.tb;X.prototype.getZIndex=X.prototype.Tb;X.prototype.setExtent=X.prototype.dc;X.prototype.setMaxResolution=X.prototype.lc;X.prototype.setMinResolution=X.prototype.mc;
X.prototype.setOpacity=X.prototype.ec;X.prototype.setVisible=X.prototype.fc;X.prototype.setZIndex=X.prototype.gc;X.prototype.get=X.prototype.get;X.prototype.getKeys=X.prototype.P;X.prototype.getProperties=X.prototype.R;X.prototype.set=X.prototype.set;X.prototype.setProperties=X.prototype.I;X.prototype.unset=X.prototype.S;X.prototype.changed=X.prototype.u;X.prototype.dispatchEvent=X.prototype.s;X.prototype.getRevision=X.prototype.L;X.prototype.on=X.prototype.H;X.prototype.once=X.prototype.M;
X.prototype.un=X.prototype.K;X.prototype.unByKey=X.prototype.N;Rl.prototype.setMap=Rl.prototype.setMap;Rl.prototype.setSource=Rl.prototype.Dc;Rl.prototype.getExtent=Rl.prototype.J;Rl.prototype.getMaxResolution=Rl.prototype.Ob;Rl.prototype.getMinResolution=Rl.prototype.Pb;Rl.prototype.getOpacity=Rl.prototype.Sb;Rl.prototype.getVisible=Rl.prototype.tb;Rl.prototype.getZIndex=Rl.prototype.Tb;Rl.prototype.setExtent=Rl.prototype.dc;Rl.prototype.setMaxResolution=Rl.prototype.lc;
Rl.prototype.setMinResolution=Rl.prototype.mc;Rl.prototype.setOpacity=Rl.prototype.ec;Rl.prototype.setVisible=Rl.prototype.fc;Rl.prototype.setZIndex=Rl.prototype.gc;Rl.prototype.get=Rl.prototype.get;Rl.prototype.getKeys=Rl.prototype.P;Rl.prototype.getProperties=Rl.prototype.R;Rl.prototype.set=Rl.prototype.set;Rl.prototype.setProperties=Rl.prototype.I;Rl.prototype.unset=Rl.prototype.S;Rl.prototype.changed=Rl.prototype.u;Rl.prototype.dispatchEvent=Rl.prototype.s;Rl.prototype.getRevision=Rl.prototype.L;
Rl.prototype.on=Rl.prototype.H;Rl.prototype.once=Rl.prototype.M;Rl.prototype.un=Rl.prototype.K;Rl.prototype.unByKey=Rl.prototype.N;Hl.prototype.getExtent=Hl.prototype.J;Hl.prototype.getMaxResolution=Hl.prototype.Ob;Hl.prototype.getMinResolution=Hl.prototype.Pb;Hl.prototype.getOpacity=Hl.prototype.Sb;Hl.prototype.getVisible=Hl.prototype.tb;Hl.prototype.getZIndex=Hl.prototype.Tb;Hl.prototype.setExtent=Hl.prototype.dc;Hl.prototype.setMaxResolution=Hl.prototype.lc;Hl.prototype.setMinResolution=Hl.prototype.mc;
Hl.prototype.setOpacity=Hl.prototype.ec;Hl.prototype.setVisible=Hl.prototype.fc;Hl.prototype.setZIndex=Hl.prototype.gc;Hl.prototype.get=Hl.prototype.get;Hl.prototype.getKeys=Hl.prototype.P;Hl.prototype.getProperties=Hl.prototype.R;Hl.prototype.set=Hl.prototype.set;Hl.prototype.setProperties=Hl.prototype.I;Hl.prototype.unset=Hl.prototype.S;Hl.prototype.changed=Hl.prototype.u;Hl.prototype.dispatchEvent=Hl.prototype.s;Hl.prototype.getRevision=Hl.prototype.L;Hl.prototype.on=Hl.prototype.H;
Hl.prototype.once=Hl.prototype.M;Hl.prototype.un=Hl.prototype.K;Hl.prototype.unByKey=Hl.prototype.N;H.prototype.setMap=H.prototype.setMap;H.prototype.setSource=H.prototype.Dc;H.prototype.getExtent=H.prototype.J;H.prototype.getMaxResolution=H.prototype.Ob;H.prototype.getMinResolution=H.prototype.Pb;H.prototype.getOpacity=H.prototype.Sb;H.prototype.getVisible=H.prototype.tb;H.prototype.getZIndex=H.prototype.Tb;H.prototype.setExtent=H.prototype.dc;H.prototype.setMaxResolution=H.prototype.lc;
H.prototype.setMinResolution=H.prototype.mc;H.prototype.setOpacity=H.prototype.ec;H.prototype.setVisible=H.prototype.fc;H.prototype.setZIndex=H.prototype.gc;H.prototype.get=H.prototype.get;H.prototype.getKeys=H.prototype.P;H.prototype.getProperties=H.prototype.R;H.prototype.set=H.prototype.set;H.prototype.setProperties=H.prototype.I;H.prototype.unset=H.prototype.S;H.prototype.changed=H.prototype.u;H.prototype.dispatchEvent=H.prototype.s;H.prototype.getRevision=H.prototype.L;H.prototype.on=H.prototype.H;
H.prototype.once=H.prototype.M;H.prototype.un=H.prototype.K;H.prototype.unByKey=H.prototype.N;L.prototype.getStyle=L.prototype.C;L.prototype.getStyleFunction=L.prototype.D;L.prototype.setStyle=L.prototype.c;L.prototype.setMap=L.prototype.setMap;L.prototype.setSource=L.prototype.Dc;L.prototype.getExtent=L.prototype.J;L.prototype.getMaxResolution=L.prototype.Ob;L.prototype.getMinResolution=L.prototype.Pb;L.prototype.getOpacity=L.prototype.Sb;L.prototype.getVisible=L.prototype.tb;
L.prototype.getZIndex=L.prototype.Tb;L.prototype.setExtent=L.prototype.dc;L.prototype.setMaxResolution=L.prototype.lc;L.prototype.setMinResolution=L.prototype.mc;L.prototype.setOpacity=L.prototype.ec;L.prototype.setVisible=L.prototype.fc;L.prototype.setZIndex=L.prototype.gc;L.prototype.get=L.prototype.get;L.prototype.getKeys=L.prototype.P;L.prototype.getProperties=L.prototype.R;L.prototype.set=L.prototype.set;L.prototype.setProperties=L.prototype.I;L.prototype.unset=L.prototype.S;
L.prototype.changed=L.prototype.u;L.prototype.dispatchEvent=L.prototype.s;L.prototype.getRevision=L.prototype.L;L.prototype.on=L.prototype.H;L.prototype.once=L.prototype.M;L.prototype.un=L.prototype.K;L.prototype.unByKey=L.prototype.N;Kk.prototype.get=Kk.prototype.get;Kk.prototype.getKeys=Kk.prototype.P;Kk.prototype.getProperties=Kk.prototype.R;Kk.prototype.set=Kk.prototype.set;Kk.prototype.setProperties=Kk.prototype.I;Kk.prototype.unset=Kk.prototype.S;Kk.prototype.changed=Kk.prototype.u;
Kk.prototype.dispatchEvent=Kk.prototype.s;Kk.prototype.getRevision=Kk.prototype.L;Kk.prototype.on=Kk.prototype.H;Kk.prototype.once=Kk.prototype.M;Kk.prototype.un=Kk.prototype.K;Kk.prototype.unByKey=Kk.prototype.N;Ok.prototype.getActive=Ok.prototype.b;Ok.prototype.getMap=Ok.prototype.i;Ok.prototype.setActive=Ok.prototype.g;Ok.prototype.get=Ok.prototype.get;Ok.prototype.getKeys=Ok.prototype.P;Ok.prototype.getProperties=Ok.prototype.R;Ok.prototype.set=Ok.prototype.set;Ok.prototype.setProperties=Ok.prototype.I;
Ok.prototype.unset=Ok.prototype.S;Ok.prototype.changed=Ok.prototype.u;Ok.prototype.dispatchEvent=Ok.prototype.s;Ok.prototype.getRevision=Ok.prototype.L;Ok.prototype.on=Ok.prototype.H;Ok.prototype.once=Ok.prototype.M;Ok.prototype.un=Ok.prototype.K;Ok.prototype.unByKey=Ok.prototype.N;vy.prototype.getActive=vy.prototype.b;vy.prototype.getMap=vy.prototype.i;vy.prototype.setActive=vy.prototype.g;vy.prototype.get=vy.prototype.get;vy.prototype.getKeys=vy.prototype.P;vy.prototype.getProperties=vy.prototype.R;
vy.prototype.set=vy.prototype.set;vy.prototype.setProperties=vy.prototype.I;vy.prototype.unset=vy.prototype.S;vy.prototype.changed=vy.prototype.u;vy.prototype.dispatchEvent=vy.prototype.s;vy.prototype.getRevision=vy.prototype.L;vy.prototype.on=vy.prototype.H;vy.prototype.once=vy.prototype.M;vy.prototype.un=vy.prototype.K;vy.prototype.unByKey=vy.prototype.N;Xk.prototype.getActive=Xk.prototype.b;Xk.prototype.getMap=Xk.prototype.i;Xk.prototype.setActive=Xk.prototype.g;Xk.prototype.get=Xk.prototype.get;
Xk.prototype.getKeys=Xk.prototype.P;Xk.prototype.getProperties=Xk.prototype.R;Xk.prototype.set=Xk.prototype.set;Xk.prototype.setProperties=Xk.prototype.I;Xk.prototype.unset=Xk.prototype.S;Xk.prototype.changed=Xk.prototype.u;Xk.prototype.dispatchEvent=Xk.prototype.s;Xk.prototype.getRevision=Xk.prototype.L;Xk.prototype.on=Xk.prototype.H;Xk.prototype.once=Xk.prototype.M;Xk.prototype.un=Xk.prototype.K;Xk.prototype.unByKey=Xk.prototype.N;ll.prototype.getActive=ll.prototype.b;ll.prototype.getMap=ll.prototype.i;
ll.prototype.setActive=ll.prototype.g;ll.prototype.get=ll.prototype.get;ll.prototype.getKeys=ll.prototype.P;ll.prototype.getProperties=ll.prototype.R;ll.prototype.set=ll.prototype.set;ll.prototype.setProperties=ll.prototype.I;ll.prototype.unset=ll.prototype.S;ll.prototype.changed=ll.prototype.u;ll.prototype.dispatchEvent=ll.prototype.s;ll.prototype.getRevision=ll.prototype.L;ll.prototype.on=ll.prototype.H;ll.prototype.once=ll.prototype.M;ll.prototype.un=ll.prototype.K;ll.prototype.unByKey=ll.prototype.N;
$k.prototype.getActive=$k.prototype.b;$k.prototype.getMap=$k.prototype.i;$k.prototype.setActive=$k.prototype.g;$k.prototype.get=$k.prototype.get;$k.prototype.getKeys=$k.prototype.P;$k.prototype.getProperties=$k.prototype.R;$k.prototype.set=$k.prototype.set;$k.prototype.setProperties=$k.prototype.I;$k.prototype.unset=$k.prototype.S;$k.prototype.changed=$k.prototype.u;$k.prototype.dispatchEvent=$k.prototype.s;$k.prototype.getRevision=$k.prototype.L;$k.prototype.on=$k.prototype.H;$k.prototype.once=$k.prototype.M;
$k.prototype.un=$k.prototype.K;$k.prototype.unByKey=$k.prototype.N;zy.prototype.getActive=zy.prototype.b;zy.prototype.getMap=zy.prototype.i;zy.prototype.setActive=zy.prototype.g;zy.prototype.get=zy.prototype.get;zy.prototype.getKeys=zy.prototype.P;zy.prototype.getProperties=zy.prototype.R;zy.prototype.set=zy.prototype.set;zy.prototype.setProperties=zy.prototype.I;zy.prototype.unset=zy.prototype.S;zy.prototype.changed=zy.prototype.u;zy.prototype.dispatchEvent=zy.prototype.s;
zy.prototype.getRevision=zy.prototype.L;zy.prototype.on=zy.prototype.H;zy.prototype.once=zy.prototype.M;zy.prototype.un=zy.prototype.K;zy.prototype.unByKey=zy.prototype.N;dl.prototype.getActive=dl.prototype.b;dl.prototype.getMap=dl.prototype.i;dl.prototype.setActive=dl.prototype.g;dl.prototype.get=dl.prototype.get;dl.prototype.getKeys=dl.prototype.P;dl.prototype.getProperties=dl.prototype.R;dl.prototype.set=dl.prototype.set;dl.prototype.setProperties=dl.prototype.I;dl.prototype.unset=dl.prototype.S;
dl.prototype.changed=dl.prototype.u;dl.prototype.dispatchEvent=dl.prototype.s;dl.prototype.getRevision=dl.prototype.L;dl.prototype.on=dl.prototype.H;dl.prototype.once=dl.prototype.M;dl.prototype.un=dl.prototype.K;dl.prototype.unByKey=dl.prototype.N;rl.prototype.getGeometry=rl.prototype.W;rl.prototype.getActive=rl.prototype.b;rl.prototype.getMap=rl.prototype.i;rl.prototype.setActive=rl.prototype.g;rl.prototype.get=rl.prototype.get;rl.prototype.getKeys=rl.prototype.P;rl.prototype.getProperties=rl.prototype.R;
rl.prototype.set=rl.prototype.set;rl.prototype.setProperties=rl.prototype.I;rl.prototype.unset=rl.prototype.S;rl.prototype.changed=rl.prototype.u;rl.prototype.dispatchEvent=rl.prototype.s;rl.prototype.getRevision=rl.prototype.L;rl.prototype.on=rl.prototype.H;rl.prototype.once=rl.prototype.M;rl.prototype.un=rl.prototype.K;rl.prototype.unByKey=rl.prototype.N;Ey.prototype.getActive=Ey.prototype.b;Ey.prototype.getMap=Ey.prototype.i;Ey.prototype.setActive=Ey.prototype.g;Ey.prototype.get=Ey.prototype.get;
Ey.prototype.getKeys=Ey.prototype.P;Ey.prototype.getProperties=Ey.prototype.R;Ey.prototype.set=Ey.prototype.set;Ey.prototype.setProperties=Ey.prototype.I;Ey.prototype.unset=Ey.prototype.S;Ey.prototype.changed=Ey.prototype.u;Ey.prototype.dispatchEvent=Ey.prototype.s;Ey.prototype.getRevision=Ey.prototype.L;Ey.prototype.on=Ey.prototype.H;Ey.prototype.once=Ey.prototype.M;Ey.prototype.un=Ey.prototype.K;Ey.prototype.unByKey=Ey.prototype.N;sl.prototype.getActive=sl.prototype.b;sl.prototype.getMap=sl.prototype.i;
sl.prototype.setActive=sl.prototype.g;sl.prototype.get=sl.prototype.get;sl.prototype.getKeys=sl.prototype.P;sl.prototype.getProperties=sl.prototype.R;sl.prototype.set=sl.prototype.set;sl.prototype.setProperties=sl.prototype.I;sl.prototype.unset=sl.prototype.S;sl.prototype.changed=sl.prototype.u;sl.prototype.dispatchEvent=sl.prototype.s;sl.prototype.getRevision=sl.prototype.L;sl.prototype.on=sl.prototype.H;sl.prototype.once=sl.prototype.M;sl.prototype.un=sl.prototype.K;sl.prototype.unByKey=sl.prototype.N;
ul.prototype.getActive=ul.prototype.b;ul.prototype.getMap=ul.prototype.i;ul.prototype.setActive=ul.prototype.g;ul.prototype.get=ul.prototype.get;ul.prototype.getKeys=ul.prototype.P;ul.prototype.getProperties=ul.prototype.R;ul.prototype.set=ul.prototype.set;ul.prototype.setProperties=ul.prototype.I;ul.prototype.unset=ul.prototype.S;ul.prototype.changed=ul.prototype.u;ul.prototype.dispatchEvent=ul.prototype.s;ul.prototype.getRevision=ul.prototype.L;ul.prototype.on=ul.prototype.H;ul.prototype.once=ul.prototype.M;
ul.prototype.un=ul.prototype.K;ul.prototype.unByKey=ul.prototype.N;Vy.prototype.getActive=Vy.prototype.b;Vy.prototype.getMap=Vy.prototype.i;Vy.prototype.setActive=Vy.prototype.g;Vy.prototype.get=Vy.prototype.get;Vy.prototype.getKeys=Vy.prototype.P;Vy.prototype.getProperties=Vy.prototype.R;Vy.prototype.set=Vy.prototype.set;Vy.prototype.setProperties=Vy.prototype.I;Vy.prototype.unset=Vy.prototype.S;Vy.prototype.changed=Vy.prototype.u;Vy.prototype.dispatchEvent=Vy.prototype.s;
Vy.prototype.getRevision=Vy.prototype.L;Vy.prototype.on=Vy.prototype.H;Vy.prototype.once=Vy.prototype.M;Vy.prototype.un=Vy.prototype.K;Vy.prototype.unByKey=Vy.prototype.N;wl.prototype.getActive=wl.prototype.b;wl.prototype.getMap=wl.prototype.i;wl.prototype.setActive=wl.prototype.g;wl.prototype.get=wl.prototype.get;wl.prototype.getKeys=wl.prototype.P;wl.prototype.getProperties=wl.prototype.R;wl.prototype.set=wl.prototype.set;wl.prototype.setProperties=wl.prototype.I;wl.prototype.unset=wl.prototype.S;
wl.prototype.changed=wl.prototype.u;wl.prototype.dispatchEvent=wl.prototype.s;wl.prototype.getRevision=wl.prototype.L;wl.prototype.on=wl.prototype.H;wl.prototype.once=wl.prototype.M;wl.prototype.un=wl.prototype.K;wl.prototype.unByKey=wl.prototype.N;yl.prototype.getActive=yl.prototype.b;yl.prototype.getMap=yl.prototype.i;yl.prototype.setActive=yl.prototype.g;yl.prototype.get=yl.prototype.get;yl.prototype.getKeys=yl.prototype.P;yl.prototype.getProperties=yl.prototype.R;yl.prototype.set=yl.prototype.set;
yl.prototype.setProperties=yl.prototype.I;yl.prototype.unset=yl.prototype.S;yl.prototype.changed=yl.prototype.u;yl.prototype.dispatchEvent=yl.prototype.s;yl.prototype.getRevision=yl.prototype.L;yl.prototype.on=yl.prototype.H;yl.prototype.once=yl.prototype.M;yl.prototype.un=yl.prototype.K;yl.prototype.unByKey=yl.prototype.N;Cl.prototype.getActive=Cl.prototype.b;Cl.prototype.getMap=Cl.prototype.i;Cl.prototype.setActive=Cl.prototype.g;Cl.prototype.get=Cl.prototype.get;Cl.prototype.getKeys=Cl.prototype.P;
Cl.prototype.getProperties=Cl.prototype.R;Cl.prototype.set=Cl.prototype.set;Cl.prototype.setProperties=Cl.prototype.I;Cl.prototype.unset=Cl.prototype.S;Cl.prototype.changed=Cl.prototype.u;Cl.prototype.dispatchEvent=Cl.prototype.s;Cl.prototype.getRevision=Cl.prototype.L;Cl.prototype.on=Cl.prototype.H;Cl.prototype.once=Cl.prototype.M;Cl.prototype.un=Cl.prototype.K;Cl.prototype.unByKey=Cl.prototype.N;iz.prototype.getActive=iz.prototype.b;iz.prototype.getMap=iz.prototype.i;iz.prototype.setActive=iz.prototype.g;
iz.prototype.get=iz.prototype.get;iz.prototype.getKeys=iz.prototype.P;iz.prototype.getProperties=iz.prototype.R;iz.prototype.set=iz.prototype.set;iz.prototype.setProperties=iz.prototype.I;iz.prototype.unset=iz.prototype.S;iz.prototype.changed=iz.prototype.u;iz.prototype.dispatchEvent=iz.prototype.s;iz.prototype.getRevision=iz.prototype.L;iz.prototype.on=iz.prototype.H;iz.prototype.once=iz.prototype.M;iz.prototype.un=iz.prototype.K;iz.prototype.unByKey=iz.prototype.N;lz.prototype.getActive=lz.prototype.b;
lz.prototype.getMap=lz.prototype.i;lz.prototype.setActive=lz.prototype.g;lz.prototype.get=lz.prototype.get;lz.prototype.getKeys=lz.prototype.P;lz.prototype.getProperties=lz.prototype.R;lz.prototype.set=lz.prototype.set;lz.prototype.setProperties=lz.prototype.I;lz.prototype.unset=lz.prototype.S;lz.prototype.changed=lz.prototype.u;lz.prototype.dispatchEvent=lz.prototype.s;lz.prototype.getRevision=lz.prototype.L;lz.prototype.on=lz.prototype.H;lz.prototype.once=lz.prototype.M;lz.prototype.un=lz.prototype.K;
lz.prototype.unByKey=lz.prototype.N;qz.prototype.getActive=qz.prototype.b;qz.prototype.getMap=qz.prototype.i;qz.prototype.setActive=qz.prototype.g;qz.prototype.get=qz.prototype.get;qz.prototype.getKeys=qz.prototype.P;qz.prototype.getProperties=qz.prototype.R;qz.prototype.set=qz.prototype.set;qz.prototype.setProperties=qz.prototype.I;qz.prototype.unset=qz.prototype.S;qz.prototype.changed=qz.prototype.u;qz.prototype.dispatchEvent=qz.prototype.s;qz.prototype.getRevision=qz.prototype.L;
qz.prototype.on=qz.prototype.H;qz.prototype.once=qz.prototype.M;qz.prototype.un=qz.prototype.K;qz.prototype.unByKey=qz.prototype.N;$e.prototype.get=$e.prototype.get;$e.prototype.getKeys=$e.prototype.P;$e.prototype.getProperties=$e.prototype.R;$e.prototype.set=$e.prototype.set;$e.prototype.setProperties=$e.prototype.I;$e.prototype.unset=$e.prototype.S;$e.prototype.changed=$e.prototype.u;$e.prototype.dispatchEvent=$e.prototype.s;$e.prototype.getRevision=$e.prototype.L;$e.prototype.on=$e.prototype.H;
$e.prototype.once=$e.prototype.M;$e.prototype.un=$e.prototype.K;$e.prototype.unByKey=$e.prototype.N;bf.prototype.getClosestPoint=bf.prototype.sb;bf.prototype.getExtent=bf.prototype.J;bf.prototype.simplify=bf.prototype.zb;bf.prototype.transform=bf.prototype.nb;bf.prototype.get=bf.prototype.get;bf.prototype.getKeys=bf.prototype.P;bf.prototype.getProperties=bf.prototype.R;bf.prototype.set=bf.prototype.set;bf.prototype.setProperties=bf.prototype.I;bf.prototype.unset=bf.prototype.S;
bf.prototype.changed=bf.prototype.u;bf.prototype.dispatchEvent=bf.prototype.s;bf.prototype.getRevision=bf.prototype.L;bf.prototype.on=bf.prototype.H;bf.prototype.once=bf.prototype.M;bf.prototype.un=bf.prototype.K;bf.prototype.unByKey=bf.prototype.N;Sx.prototype.getFirstCoordinate=Sx.prototype.Lb;Sx.prototype.getLastCoordinate=Sx.prototype.Mb;Sx.prototype.getLayout=Sx.prototype.Nb;Sx.prototype.getClosestPoint=Sx.prototype.sb;Sx.prototype.getExtent=Sx.prototype.J;Sx.prototype.simplify=Sx.prototype.zb;
Sx.prototype.get=Sx.prototype.get;Sx.prototype.getKeys=Sx.prototype.P;Sx.prototype.getProperties=Sx.prototype.R;Sx.prototype.set=Sx.prototype.set;Sx.prototype.setProperties=Sx.prototype.I;Sx.prototype.unset=Sx.prototype.S;Sx.prototype.changed=Sx.prototype.u;Sx.prototype.dispatchEvent=Sx.prototype.s;Sx.prototype.getRevision=Sx.prototype.L;Sx.prototype.on=Sx.prototype.H;Sx.prototype.once=Sx.prototype.M;Sx.prototype.un=Sx.prototype.K;Sx.prototype.unByKey=Sx.prototype.N;ms.prototype.getClosestPoint=ms.prototype.sb;
ms.prototype.getExtent=ms.prototype.J;ms.prototype.simplify=ms.prototype.zb;ms.prototype.transform=ms.prototype.nb;ms.prototype.get=ms.prototype.get;ms.prototype.getKeys=ms.prototype.P;ms.prototype.getProperties=ms.prototype.R;ms.prototype.set=ms.prototype.set;ms.prototype.setProperties=ms.prototype.I;ms.prototype.unset=ms.prototype.S;ms.prototype.changed=ms.prototype.u;ms.prototype.dispatchEvent=ms.prototype.s;ms.prototype.getRevision=ms.prototype.L;ms.prototype.on=ms.prototype.H;
ms.prototype.once=ms.prototype.M;ms.prototype.un=ms.prototype.K;ms.prototype.unByKey=ms.prototype.N;vf.prototype.getFirstCoordinate=vf.prototype.Lb;vf.prototype.getLastCoordinate=vf.prototype.Mb;vf.prototype.getLayout=vf.prototype.Nb;vf.prototype.getClosestPoint=vf.prototype.sb;vf.prototype.getExtent=vf.prototype.J;vf.prototype.simplify=vf.prototype.zb;vf.prototype.transform=vf.prototype.nb;vf.prototype.get=vf.prototype.get;vf.prototype.getKeys=vf.prototype.P;vf.prototype.getProperties=vf.prototype.R;
vf.prototype.set=vf.prototype.set;vf.prototype.setProperties=vf.prototype.I;vf.prototype.unset=vf.prototype.S;vf.prototype.changed=vf.prototype.u;vf.prototype.dispatchEvent=vf.prototype.s;vf.prototype.getRevision=vf.prototype.L;vf.prototype.on=vf.prototype.H;vf.prototype.once=vf.prototype.M;vf.prototype.un=vf.prototype.K;vf.prototype.unByKey=vf.prototype.N;U.prototype.getFirstCoordinate=U.prototype.Lb;U.prototype.getLastCoordinate=U.prototype.Mb;U.prototype.getLayout=U.prototype.Nb;
U.prototype.getClosestPoint=U.prototype.sb;U.prototype.getExtent=U.prototype.J;U.prototype.simplify=U.prototype.zb;U.prototype.transform=U.prototype.nb;U.prototype.get=U.prototype.get;U.prototype.getKeys=U.prototype.P;U.prototype.getProperties=U.prototype.R;U.prototype.set=U.prototype.set;U.prototype.setProperties=U.prototype.I;U.prototype.unset=U.prototype.S;U.prototype.changed=U.prototype.u;U.prototype.dispatchEvent=U.prototype.s;U.prototype.getRevision=U.prototype.L;U.prototype.on=U.prototype.H;
U.prototype.once=U.prototype.M;U.prototype.un=U.prototype.K;U.prototype.unByKey=U.prototype.N;V.prototype.getFirstCoordinate=V.prototype.Lb;V.prototype.getLastCoordinate=V.prototype.Mb;V.prototype.getLayout=V.prototype.Nb;V.prototype.getClosestPoint=V.prototype.sb;V.prototype.getExtent=V.prototype.J;V.prototype.simplify=V.prototype.zb;V.prototype.transform=V.prototype.nb;V.prototype.get=V.prototype.get;V.prototype.getKeys=V.prototype.P;V.prototype.getProperties=V.prototype.R;V.prototype.set=V.prototype.set;
V.prototype.setProperties=V.prototype.I;V.prototype.unset=V.prototype.S;V.prototype.changed=V.prototype.u;V.prototype.dispatchEvent=V.prototype.s;V.prototype.getRevision=V.prototype.L;V.prototype.on=V.prototype.H;V.prototype.once=V.prototype.M;V.prototype.un=V.prototype.K;V.prototype.unByKey=V.prototype.N;bs.prototype.getFirstCoordinate=bs.prototype.Lb;bs.prototype.getLastCoordinate=bs.prototype.Mb;bs.prototype.getLayout=bs.prototype.Nb;bs.prototype.getClosestPoint=bs.prototype.sb;
bs.prototype.getExtent=bs.prototype.J;bs.prototype.simplify=bs.prototype.zb;bs.prototype.transform=bs.prototype.nb;bs.prototype.get=bs.prototype.get;bs.prototype.getKeys=bs.prototype.P;bs.prototype.getProperties=bs.prototype.R;bs.prototype.set=bs.prototype.set;bs.prototype.setProperties=bs.prototype.I;bs.prototype.unset=bs.prototype.S;bs.prototype.changed=bs.prototype.u;bs.prototype.dispatchEvent=bs.prototype.s;bs.prototype.getRevision=bs.prototype.L;bs.prototype.on=bs.prototype.H;
bs.prototype.once=bs.prototype.M;bs.prototype.un=bs.prototype.K;bs.prototype.unByKey=bs.prototype.N;cs.prototype.getFirstCoordinate=cs.prototype.Lb;cs.prototype.getLastCoordinate=cs.prototype.Mb;cs.prototype.getLayout=cs.prototype.Nb;cs.prototype.getClosestPoint=cs.prototype.sb;cs.prototype.getExtent=cs.prototype.J;cs.prototype.simplify=cs.prototype.zb;cs.prototype.transform=cs.prototype.nb;cs.prototype.get=cs.prototype.get;cs.prototype.getKeys=cs.prototype.P;cs.prototype.getProperties=cs.prototype.R;
cs.prototype.set=cs.prototype.set;cs.prototype.setProperties=cs.prototype.I;cs.prototype.unset=cs.prototype.S;cs.prototype.changed=cs.prototype.u;cs.prototype.dispatchEvent=cs.prototype.s;cs.prototype.getRevision=cs.prototype.L;cs.prototype.on=cs.prototype.H;cs.prototype.once=cs.prototype.M;cs.prototype.un=cs.prototype.K;cs.prototype.unByKey=cs.prototype.N;F.prototype.getFirstCoordinate=F.prototype.Lb;F.prototype.getLastCoordinate=F.prototype.Mb;F.prototype.getLayout=F.prototype.Nb;
F.prototype.getClosestPoint=F.prototype.sb;F.prototype.getExtent=F.prototype.J;F.prototype.simplify=F.prototype.zb;F.prototype.transform=F.prototype.nb;F.prototype.get=F.prototype.get;F.prototype.getKeys=F.prototype.P;F.prototype.getProperties=F.prototype.R;F.prototype.set=F.prototype.set;F.prototype.setProperties=F.prototype.I;F.prototype.unset=F.prototype.S;F.prototype.changed=F.prototype.u;F.prototype.dispatchEvent=F.prototype.s;F.prototype.getRevision=F.prototype.L;F.prototype.on=F.prototype.H;
F.prototype.once=F.prototype.M;F.prototype.un=F.prototype.K;F.prototype.unByKey=F.prototype.N;G.prototype.getFirstCoordinate=G.prototype.Lb;G.prototype.getLastCoordinate=G.prototype.Mb;G.prototype.getLayout=G.prototype.Nb;G.prototype.getClosestPoint=G.prototype.sb;G.prototype.getExtent=G.prototype.J;G.prototype.simplify=G.prototype.zb;G.prototype.transform=G.prototype.nb;G.prototype.get=G.prototype.get;G.prototype.getKeys=G.prototype.P;G.prototype.getProperties=G.prototype.R;G.prototype.set=G.prototype.set;
G.prototype.setProperties=G.prototype.I;G.prototype.unset=G.prototype.S;G.prototype.changed=G.prototype.u;G.prototype.dispatchEvent=G.prototype.s;G.prototype.getRevision=G.prototype.L;G.prototype.on=G.prototype.H;G.prototype.once=G.prototype.M;G.prototype.un=G.prototype.K;G.prototype.unByKey=G.prototype.N;Ks.prototype.readFeatures=Ks.prototype.Ca;Ls.prototype.readFeatures=Ls.prototype.Ca;Ls.prototype.readFeatures=Ls.prototype.Ca;mh.prototype.get=mh.prototype.get;mh.prototype.getKeys=mh.prototype.P;
mh.prototype.getProperties=mh.prototype.R;mh.prototype.set=mh.prototype.set;mh.prototype.setProperties=mh.prototype.I;mh.prototype.unset=mh.prototype.S;mh.prototype.changed=mh.prototype.u;mh.prototype.dispatchEvent=mh.prototype.s;mh.prototype.getRevision=mh.prototype.L;mh.prototype.on=mh.prototype.H;mh.prototype.once=mh.prototype.M;mh.prototype.un=mh.prototype.K;mh.prototype.unByKey=mh.prototype.N;Qh.prototype.getMap=Qh.prototype.g;Qh.prototype.setMap=Qh.prototype.setMap;Qh.prototype.setTarget=Qh.prototype.c;
Qh.prototype.get=Qh.prototype.get;Qh.prototype.getKeys=Qh.prototype.P;Qh.prototype.getProperties=Qh.prototype.R;Qh.prototype.set=Qh.prototype.set;Qh.prototype.setProperties=Qh.prototype.I;Qh.prototype.unset=Qh.prototype.S;Qh.prototype.changed=Qh.prototype.u;Qh.prototype.dispatchEvent=Qh.prototype.s;Qh.prototype.getRevision=Qh.prototype.L;Qh.prototype.on=Qh.prototype.H;Qh.prototype.once=Qh.prototype.M;Qh.prototype.un=Qh.prototype.K;Qh.prototype.unByKey=Qh.prototype.N;bi.prototype.getMap=bi.prototype.g;
bi.prototype.setMap=bi.prototype.setMap;bi.prototype.setTarget=bi.prototype.c;bi.prototype.get=bi.prototype.get;bi.prototype.getKeys=bi.prototype.P;bi.prototype.getProperties=bi.prototype.R;bi.prototype.set=bi.prototype.set;bi.prototype.setProperties=bi.prototype.I;bi.prototype.unset=bi.prototype.S;bi.prototype.changed=bi.prototype.u;bi.prototype.dispatchEvent=bi.prototype.s;bi.prototype.getRevision=bi.prototype.L;bi.prototype.on=bi.prototype.H;bi.prototype.once=bi.prototype.M;bi.prototype.un=bi.prototype.K;
bi.prototype.unByKey=bi.prototype.N;ci.prototype.getMap=ci.prototype.g;ci.prototype.setMap=ci.prototype.setMap;ci.prototype.setTarget=ci.prototype.c;ci.prototype.get=ci.prototype.get;ci.prototype.getKeys=ci.prototype.P;ci.prototype.getProperties=ci.prototype.R;ci.prototype.set=ci.prototype.set;ci.prototype.setProperties=ci.prototype.I;ci.prototype.unset=ci.prototype.S;ci.prototype.changed=ci.prototype.u;ci.prototype.dispatchEvent=ci.prototype.s;ci.prototype.getRevision=ci.prototype.L;
ci.prototype.on=ci.prototype.H;ci.prototype.once=ci.prototype.M;ci.prototype.un=ci.prototype.K;ci.prototype.unByKey=ci.prototype.N;sr.prototype.getMap=sr.prototype.g;sr.prototype.setMap=sr.prototype.setMap;sr.prototype.setTarget=sr.prototype.c;sr.prototype.get=sr.prototype.get;sr.prototype.getKeys=sr.prototype.P;sr.prototype.getProperties=sr.prototype.R;sr.prototype.set=sr.prototype.set;sr.prototype.setProperties=sr.prototype.I;sr.prototype.unset=sr.prototype.S;sr.prototype.changed=sr.prototype.u;
sr.prototype.dispatchEvent=sr.prototype.s;sr.prototype.getRevision=sr.prototype.L;sr.prototype.on=sr.prototype.H;sr.prototype.once=sr.prototype.M;sr.prototype.un=sr.prototype.K;sr.prototype.unByKey=sr.prototype.N;Th.prototype.getMap=Th.prototype.g;Th.prototype.setMap=Th.prototype.setMap;Th.prototype.setTarget=Th.prototype.c;Th.prototype.get=Th.prototype.get;Th.prototype.getKeys=Th.prototype.P;Th.prototype.getProperties=Th.prototype.R;Th.prototype.set=Th.prototype.set;Th.prototype.setProperties=Th.prototype.I;
Th.prototype.unset=Th.prototype.S;Th.prototype.changed=Th.prototype.u;Th.prototype.dispatchEvent=Th.prototype.s;Th.prototype.getRevision=Th.prototype.L;Th.prototype.on=Th.prototype.H;Th.prototype.once=Th.prototype.M;Th.prototype.un=Th.prototype.K;Th.prototype.unByKey=Th.prototype.N;xr.prototype.getMap=xr.prototype.g;xr.prototype.setMap=xr.prototype.setMap;xr.prototype.setTarget=xr.prototype.c;xr.prototype.get=xr.prototype.get;xr.prototype.getKeys=xr.prototype.P;xr.prototype.getProperties=xr.prototype.R;
xr.prototype.set=xr.prototype.set;xr.prototype.setProperties=xr.prototype.I;xr.prototype.unset=xr.prototype.S;xr.prototype.changed=xr.prototype.u;xr.prototype.dispatchEvent=xr.prototype.s;xr.prototype.getRevision=xr.prototype.L;xr.prototype.on=xr.prototype.H;xr.prototype.once=xr.prototype.M;xr.prototype.un=xr.prototype.K;xr.prototype.unByKey=xr.prototype.N;Vh.prototype.getMap=Vh.prototype.g;Vh.prototype.setMap=Vh.prototype.setMap;Vh.prototype.setTarget=Vh.prototype.c;Vh.prototype.get=Vh.prototype.get;
Vh.prototype.getKeys=Vh.prototype.P;Vh.prototype.getProperties=Vh.prototype.R;Vh.prototype.set=Vh.prototype.set;Vh.prototype.setProperties=Vh.prototype.I;Vh.prototype.unset=Vh.prototype.S;Vh.prototype.changed=Vh.prototype.u;Vh.prototype.dispatchEvent=Vh.prototype.s;Vh.prototype.getRevision=Vh.prototype.L;Vh.prototype.on=Vh.prototype.H;Vh.prototype.once=Vh.prototype.M;Vh.prototype.un=Vh.prototype.K;Vh.prototype.unByKey=Vh.prototype.N;Lr.prototype.getMap=Lr.prototype.g;Lr.prototype.setMap=Lr.prototype.setMap;
Lr.prototype.setTarget=Lr.prototype.c;Lr.prototype.get=Lr.prototype.get;Lr.prototype.getKeys=Lr.prototype.P;Lr.prototype.getProperties=Lr.prototype.R;Lr.prototype.set=Lr.prototype.set;Lr.prototype.setProperties=Lr.prototype.I;Lr.prototype.unset=Lr.prototype.S;Lr.prototype.changed=Lr.prototype.u;Lr.prototype.dispatchEvent=Lr.prototype.s;Lr.prototype.getRevision=Lr.prototype.L;Lr.prototype.on=Lr.prototype.H;Lr.prototype.once=Lr.prototype.M;Lr.prototype.un=Lr.prototype.K;Lr.prototype.unByKey=Lr.prototype.N;
Qr.prototype.getMap=Qr.prototype.g;Qr.prototype.setMap=Qr.prototype.setMap;Qr.prototype.setTarget=Qr.prototype.c;Qr.prototype.get=Qr.prototype.get;Qr.prototype.getKeys=Qr.prototype.P;Qr.prototype.getProperties=Qr.prototype.R;Qr.prototype.set=Qr.prototype.set;Qr.prototype.setProperties=Qr.prototype.I;Qr.prototype.unset=Qr.prototype.S;Qr.prototype.changed=Qr.prototype.u;Qr.prototype.dispatchEvent=Qr.prototype.s;Qr.prototype.getRevision=Qr.prototype.L;Qr.prototype.on=Qr.prototype.H;
Qr.prototype.once=Qr.prototype.M;Qr.prototype.un=Qr.prototype.K;Qr.prototype.unByKey=Qr.prototype.N;
  return OPENLAYERS.ol;
}));



var P = {
    version: "1.0.0"
};

function expose() {
    var old = window.P;

    P.noConflict = function () {
        window.P = old;
        return this;
    };

    window.P = P;
}

// define P for Node module pattern loaders, including Browserify
if (typeof module === 'object' && typeof module.exports === 'object') {
    module.exports = P;

// define P as an AMD module
} else if (typeof define === 'function' && define.amd) {
    define(P);
}

// define gispace as a global P variable, saving the original P to restore later if needed
if (typeof window !== 'undefined') {
    expose();
}

P.Constants = {
    TWO_PI : Math.PI * 2,
    HALF_PI : Math.PI / 2,
    FITTING_COUNT : 100,
    ZERO_TOLERANCE : 0.0001  
};

P.Utils = {
    _stampId: 0
};

P.Utils.trim = function(str) {
    return str.trim ? str.trim() : str.replace(/^\s+|\s+$/g, '');
};

P.Utils.stamp = function(obj) {
    var key = '_p_id_';
    obj[key] = obj[key] || this._stampId++;
    return obj[key];
};
P.Utils.uuid = function () {
    var s = [];
    var hexDigits = "0123456789abcdef";
    for (var i = 0; i < 36; i++) {
        s[i] = hexDigits.substr(Math.floor(Math.random() * 0x10), 1);
    }
    s[14] = "4";  // bits 12-15 of the time_hi_and_version field to 0010
    s[19] = hexDigits.substr((s[19] & 0x3) | 0x8, 1);  // bits 6-7 of the clock_seq_hi_and_reserved to 01
    s[8] = s[13] = s[18] = s[23] = "-";

    var uuid = s.join("");
    return uuid
}
P.Utils.getFeatureType = function (type) {
    switch (type){
        case P.PlotTypes.ARC:
            return 'LineString';
        case P.PlotTypes.ELLIPSE:
            return 'Polygon';
        case P.PlotTypes.CURVE:
            return 'LineString';
        case P.PlotTypes.CLOSED_CURVE:
            return 'Polygon';
        case P.PlotTypes.LUNE:
            return 'Polygon';
        case P.PlotTypes.SECTOR:
            return 'Polygon';
        case P.PlotTypes.GATHERING_PLACE:
            return 'Polygon';
        case P.PlotTypes.STRAIGHT_ARROW:
            return 'LineString';
        case P.PlotTypes.ASSAULT_DIRECTION:
            return 'Polygon';
        case P.PlotTypes.ATTACK_ARROW:
            return 'Polygon';
        case P.PlotTypes.FINE_ARROW:
            return 'Polygon';
        case P.PlotTypes.CIRCLE:
            return 'Polygon';
        case P.PlotTypes.DOUBLE_ARROW:
            return 'Polygon';
        case P.PlotTypes.TAILED_ATTACK_ARROW:
            return 'Polygon';
        case P.PlotTypes.SQUAD_COMBAT:
            return 'Polygon';
        case P.PlotTypes.TAILED_SQUAD_COMBAT:
            return 'Polygon';
        case P.PlotTypes.FREEHAND_LINE:
            return 'LineString';
        case P.PlotTypes.FREEHAND_POLYGON:
            return 'Polygon';
        case P.PlotTypes.POLYGON:
            return 'Polygon';
        case P.PlotTypes.MARKER:
            return 'Point';
        case P.PlotTypes.RECTANGLE:
            return 'Polygon';
        case P.PlotTypes.POLYLINE:
            return 'LineString';
    }
};

P.Utils.handleArray = function (arr,type) {
    var array = []
    if(type === 'Point'){
        array = arr
    }else if(type === "Polygon"){
        var data = []
        for (var i =0;i<arr.length;i++){
            if(i%2>0){
                data.push([arr[i-1],arr[i]])
            }
        }
        data.push(data[0])
        array.push(data)
    }else{
        for (var i =0;i<arr.length;i++){
            if(i%2>0){
                array.push([arr[i-1],arr[i]])
            }
        }
    }
    return array
}


P.DomUtils = {};

P.DomUtils.create = function(tagName, className, parent, id) {
    var element = document.createElement(tagName);
    element.className = className || '';
    if(id){
        element.id = id;
    }
    if (parent) {
        parent.appendChild(element);
    }
    return element;
};

P.DomUtils.createHidden = function(tagName, parent, id) {
    var element = document.createElement(tagName);
    element.style.display = 'none';
    if(id){
        element.id = id;
    }
    if(parent){
        parent.appendChild(element);
    }
    return element;
};

P.DomUtils.remove = function(element, parent) {
    if (parent && element) {
        parent.removeChild(element);
    }
};

P.DomUtils.get = function(id) {
    return document.getElementById(id);
};

P.DomUtils.getStyle = function(element, name) {
    var value = element.style[name];
    return value === 'auto' ? null : value;
};

P.DomUtils.hasClass = function(element, name) {
    return (element.className.length > 0) &&
        new RegExp('(^|\\s)' + name + '(\\s|$)').test(element.className);
};

P.DomUtils.addClass = function(element, name) {
    if (this.hasClass(element, name)) {
        return;
    }
    if (element.className) {
        element.className += ' ';
    }
    element.className += name;
};

P.DomUtils.removeClass = function(element, name) {
    element.className = P.Utils.trim((' ' + element.className + ' ').replace(' ' + name + ' ', ' '));
};

P.DomUtils.getDomEventKey = function(type, fn, context) {
    return '_p_dom_event_' + type + '_' + P.Utils.stamp(fn) + (context ? '_' + P.Utils.stamp(context) : '');
};

P.DomUtils.addListener = function(element, type, fn, context) {
    var self = this,
        eventKey = P.DomUtils.getDomEventKey(type, fn, context),
        handler = element[eventKey];

    if (handler) {
        return self;
    }

    handler = function(e) {
        return fn.call(context || element, e);
    };

    if ('addEventListener' in element) {
        element.addEventListener(type, handler, false);
    } else if ('attachEvent' in element) {
        element.attachEvent('on' + type, handler);
    }

    element[eventKey] = handler;
    return self;
};

P.DomUtils.removeListener = function(element, type, fn, context) {
    var self = this,
        eventKey = P.DomUtils.getDomEventKey(type, fn, context),
        handler = element[eventKey];

    if (!handler) {
        return self;
    }

    if ('removeEventListener' in element) {
        element.removeEventListener(type, handler, false);
    } else if ('detachEvent' in element) {
        element.detachEvent('on' + type, handler);
    }

    element[eventKey] = null;

    return self;
};

P.PlotTypes = {
    ARC: "arc",
    ELLIPSE: "ellipse",
    CURVE: "curve",
    CLOSED_CURVE: "closedcurve",
    LUNE: "lune",
    SECTOR: "sector",
    GATHERING_PLACE: "gatheringplace",
    STRAIGHT_ARROW: "straightarrow",
    ASSAULT_DIRECTION: "assaultdirection",
    ATTACK_ARROW: "attackarrow",
    TAILED_ATTACK_ARROW: "tailedattackarrow",
    SQUAD_COMBAT: "squadcombat",
    TAILED_SQUAD_COMBAT: "tailedsquadcombat",
    FINE_ARROW: "finearrow",
    CIRCLE: "circle",
    DOUBLE_ARROW: "doublearrow",
    POLYLINE: "polyline",
    FREEHAND_LINE: "freehandline",
    POLYGON: "polygon",
    FREEHAND_POLYGON: "freehandpolygon",
    RECTANGLE: "rectangle", 
    MARKER: "marker",
    TRIANGLE: "triangle"
};

P.PlotUtils = {};

P.PlotUtils.wgsToMercator = function(point) {
    var wgsLon = point[0]
    var wgsLat = point[1]
    var x = wgsLon * 20037508.34 / 180.;
    var y = Math.log(Math.tan((90. + wgsLat) * Math.PI / 360.)) / (Math.PI / 180.);
    y = y * 20037508.34 / 180.;
    return [x,y];
};
P.PlotUtils.mercatorToWGS =  function(point) {
    var mercatorLon = point[0];
    var mercatorLat = point[1]
    var x = mercatorLon / 20037508.34 * 180.;
    var y = mercatorLat / 20037508.34 * 180.;
    y = 180 / Math.PI * (2 * Math.atan(Math.exp(y * Math.PI / 180.)) - Math.PI / 2);
    return [x,y];
},
P.PlotUtils.distance = function(pnt1, pnt2){
    return Math.sqrt(Math.pow((pnt1[0] - pnt2[0]), 2) + Math.pow((pnt1[1] - pnt2[1]), 2));;
};

P.PlotUtils.wholeDistance = function(points){
    var distance = 0;
    for(var i=0; i<points.length-1; i++)
    distance += P.PlotUtils.distance(points[i], points[i+1]);
    return distance;
};

P.PlotUtils.getBaseLength = function(points){
    return Math.pow(P.PlotUtils.wholeDistance(points), 0.99);
    //return P.PlotUtils.wholeDistance(points);
};

P.PlotUtils.mid = function(pnt1, pnt2){
    return [(pnt1[0]+pnt2[0])/2, (pnt1[1]+pnt2[1])/2];
};

P.PlotUtils.getCircleCenterOfThreePoints = function(pnt1, pnt2, pnt3){
    var pntA = [(pnt1[0]+pnt2[0])/2, (pnt1[1]+pnt2[1])/2];
    var pntB = [pntA[0]-pnt1[1]+pnt2[1], pntA[1]+pnt1[0]-pnt2[0]];
    var pntC = [(pnt1[0]+pnt3[0])/2, (pnt1[1]+pnt3[1])/2];
    var pntD = [pntC[0]-pnt1[1]+pnt3[1], pntC[1]+pnt1[0]-pnt3[0]];
    return P.PlotUtils.getIntersectPoint(pntA, pntB, pntC, pntD);
};

P.PlotUtils.getIntersectPoint = function(pntA, pntB, pntC, pntD){
    if(pntA[1] == pntB[1]){
        var f = (pntD[0]-pntC[0])/(pntD[1]-pntC[1]);
        var x = f*(pntA[1]-pntC[1])+pntC[0];
        var y = pntA[1];
        return [x, y];
    }
    if(pntC[1] == pntD[1]){
        var e = (pntB[0]-pntA[0])/(pntB[1]-pntA[1]);
        x = e*(pntC[1]-pntA[1])+pntA[0];
        y = pntC[1];
        return [x, y];
    }
    e = (pntB[0]-pntA[0])/(pntB[1]-pntA[1]);
    f = (pntD[0]-pntC[0])/(pntD[1]-pntC[1]);
    y = (e*pntA[1]-pntA[0]-f*pntC[1]+pntC[0])/(e-f);
    x = e*y-e*pntA[1]+pntA[0];
    return [x, y];
};

P.PlotUtils.getAzimuth = function(startPnt, endPnt){
    var azimuth;
    var angle=Math.asin(Math.abs(endPnt[1] - startPnt[1]) / P.PlotUtils.distance(startPnt, endPnt));
    if (endPnt[1] >= startPnt[1] && endPnt[0] >= startPnt[0])
        azimuth=angle + Math.PI;
    else if (endPnt[1] >= startPnt[1] && endPnt[0] < startPnt[0])
        azimuth=P.Constants.TWO_PI - angle;
    else if (endPnt[1] < startPnt[1] && endPnt[0] < startPnt[0])
        azimuth=angle;
    else if (endPnt[1] < startPnt[1] && endPnt[0] >= startPnt[0])
        azimuth=Math.PI - angle;
    return azimuth;
};

P.PlotUtils.getAngleOfThreePoints = function(pntA, pntB, pntC){
    var angle=P.PlotUtils.getAzimuth(pntB, pntA) - P.PlotUtils.getAzimuth(pntB, pntC);
    return (angle<0 ? angle + P.Constants.TWO_PI : angle);
};

P.PlotUtils.isClockWise = function(pnt1, pnt2, pnt3){
    return ((pnt3[1]-pnt1[1])*(pnt2[0]-pnt1[0]) > (pnt2[1]-pnt1[1])*(pnt3[0]-pnt1[0]));
};

P.PlotUtils.getPointOnLine = function(t, startPnt, endPnt){
    var x = startPnt[0] + (t * (endPnt[0] - startPnt[0]));
    var y = startPnt[1] + (t * (endPnt[1] - startPnt[1]));
    return [x, y];
};

P.PlotUtils.getCubicValue = function(t, startPnt, cPnt1, cPnt2, endPnt){
    t = Math.max(Math.min(t, 1), 0);
    var tp = 1 - t;
    var t2 = t * t;
    var t3 = t2 * t;
    var tp2 = tp * tp;
    var tp3 = tp2 * tp;
    var x = (tp3*startPnt[0]) + (3*tp2*t*cPnt1[0]) + (3*tp*t2*cPnt2[0]) + (t3*endPnt[0]);
    var y = (tp3*startPnt[1]) + (3*tp2*t*cPnt1[1]) + (3*tp*t2*cPnt2[1]) + (t3*endPnt[1]);
    return [x, y];
};

P.PlotUtils.getThirdPoint = function(startPnt, endPnt, angle, distance, clockWise){
    var azimuth=P.PlotUtils.getAzimuth(startPnt, endPnt);
    var alpha = clockWise ? azimuth+angle : azimuth-angle;
    var dx=distance * Math.cos(alpha);
    var dy=distance * Math.sin(alpha);
    return [endPnt[0] + dx, endPnt[1] + dy]; 
};

P.PlotUtils.getArcPoints = function(center, radius, startAngle, endAngle){
    var x, y, pnts=[];
    var angleDiff = endAngle - startAngle;
    angleDiff = angleDiff < 0 ? angleDiff + P.Constants.TWO_PI : angleDiff;
    for (var i=0; i<=P.Constants.FITTING_COUNT; i++)
    {
        var angle = startAngle + angleDiff * i / P.Constants.FITTING_COUNT;
        x=center[0] + radius * Math.cos(angle);
        y=center[1] + radius * Math.sin(angle);
        // pnts.push([x, y]);
        pnts.push([P.PlotUtils.mercatorToWGS([x, y])[0],P.PlotUtils.mercatorToWGS([x, y])[1]]);

    }
    return pnts;
};

P.PlotUtils.getBisectorNormals = function(t, pnt1, pnt2, pnt3){
    var normal = P.PlotUtils.getNormal(pnt1, pnt2, pnt3);
    var dist = Math.sqrt(normal[0]*normal[0] + normal[1]*normal[1]);
    var uX = normal[0]/dist;
    var uY = normal[1]/dist;
    var d1 = P.PlotUtils.distance(pnt1, pnt2);
    var d2 = P.PlotUtils.distance(pnt2, pnt3);
    if(dist > P.Constants.ZERO_TOLERANCE){
        if(P.PlotUtils.isClockWise(pnt1, pnt2, pnt3)){
            var dt = t * d1;
            var x = pnt2[0] - dt*uY;
            var y = pnt2[1] + dt*uX;
            var bisectorNormalRight = [x, y];
            dt = t * d2;
            x = pnt2[0] + dt*uY;
            y = pnt2[1] - dt*uX;
            var bisectorNormalLeft = [x, y];
        }
        else{
            dt = t * d1;
            x = pnt2[0] + dt*uY;
            y = pnt2[1] - dt*uX;
            bisectorNormalRight = [x, y];
            dt = t * d2;
            x = pnt2[0] - dt*uY;
            y = pnt2[1] + dt*uX;
            bisectorNormalLeft = [x, y];
        }
    }
    else{
        x = pnt2[0] + t*(pnt1[0] - pnt2[0]);
        y = pnt2[1] + t*(pnt1[1] - pnt2[1]);
        bisectorNormalRight = [x, y];
        x = pnt2[0] + t*(pnt3[0] - pnt2[0]);
        y = pnt2[1] + t*(pnt3[1] - pnt2[1]);
        bisectorNormalLeft = [x, y];
    }
    return [bisectorNormalRight, bisectorNormalLeft];
};

P.PlotUtils.getNormal = function(pnt1, pnt2, pnt3){
    var dX1 = pnt1[0] - pnt2[0];
    var dY1 = pnt1[1] - pnt2[1];
    var d1 = Math.sqrt(dX1*dX1 + dY1*dY1);
    dX1 /= d1;
    dY1 /= d1;

    var dX2 = pnt3[0] - pnt2[0];
    var dY2 = pnt3[1] - pnt2[1];
    var d2 = Math.sqrt(dX2*dX2 + dY2*dY2);
    dX2 /= d2;
    dY2 /= d2;

    var uX = dX1 + dX2;
    var uY = dY1 + dY2;
    return [uX, uY];
};

P.PlotUtils.getCurvePoints = function(t, controlPoints){
    var leftControl = P.PlotUtils.getLeftMostControlPoint(controlPoints);
    var normals = [leftControl];
    for(var i=0; i<controlPoints.length-2; i++){
        var pnt1 = controlPoints[i];
        var pnt2 = controlPoints[i+1];
        var pnt3 = controlPoints[i+2];
        var normalPoints = P.PlotUtils.getBisectorNormals(t, pnt1, pnt2, pnt3);
        normals = normals.concat(normalPoints);
    }
    var rightControl = P.PlotUtils.getRightMostControlPoint(controlPoints);
    normals.push(rightControl);
    var points = [];
    for(i=0; i<controlPoints.length-1; i++){
        pnt1 = controlPoints[i];
        pnt2 = controlPoints[i+1];
        points.push(pnt1);
        for(var t=0; t<P.Constants.FITTING_COUNT; t++){
            var pnt = P.PlotUtils.getCubicValue(t/P.Constants.FITTING_COUNT, pnt1, normals[i*2], normals[i*2+1], pnt2);
            points.push(pnt);
        }
        points.push(pnt2);
    }
    return points;
};

P.PlotUtils.getLeftMostControlPoint = function(controlPoints){
    var pnt1 = controlPoints[0];
    var pnt2 = controlPoints[1];
    var pnt3 = controlPoints[2];
    var pnts = P.PlotUtils.getBisectorNormals(0, pnt1, pnt2, pnt3);
    var normalRight = pnts[0];
    var normal = P.PlotUtils.getNormal(pnt1, pnt2, pnt3);
    var dist = Math.sqrt(normal[0]*normal[0] + normal[1]*normal[1]);
    if(dist > P.Constants.ZERO_TOLERANCE){
        var mid = P.PlotUtils.mid(pnt1, pnt2);
        var pX = pnt1[0] - mid[0];
        var pY = pnt1[1] - mid[1];

        var d1 = P.PlotUtils.distance(pnt1, pnt2);
        // normal at midpoint
        var n  = 2.0/d1;
        var nX = -n*pY;
        var nY = n*pX;

        // upper triangle of symmetric transform matrix
        var a11 = nX*nX - nY*nY
        var a12 = 2*nX*nY;
        var a22 = nY*nY - nX*nX;

        var dX = normalRight[0] - mid[0];
        var dY = normalRight[1] - mid[1];

        // coordinates of reflected vector
        var controlX = mid[0] + a11*dX + a12*dY;
        var controlY = mid[1] + a12*dX + a22*dY;
    }
    else{
        controlX = pnt1[0] + t*(pnt2[0] - pnt1[0]);
        controlY = pnt1[1] + t*(pnt2[1] - pnt1[1]);
    }
    return [controlX, controlY];
};

P.PlotUtils.getRightMostControlPoint = function(controlPoints){
    var count = controlPoints.length;
    var pnt1 = controlPoints[count-3];
    var pnt2 = controlPoints[count-2];
    var pnt3 = controlPoints[count-1];
    var pnts = P.PlotUtils.getBisectorNormals(0, pnt1, pnt2, pnt3);
    var normalLeft = pnts[1];
    var normal = P.PlotUtils.getNormal(pnt1, pnt2, pnt3);
    var dist = Math.sqrt(normal[0]*normal[0] + normal[1]*normal[1]);
    if(dist > P.Constants.ZERO_TOLERANCE){
        var mid = P.PlotUtils.mid(pnt2, pnt3);
        var pX = pnt3[0] - mid[0];
        var pY = pnt3[1] - mid[1];

        var d1 = P.PlotUtils.distance(pnt2, pnt3);
        // normal at midpoint
        var n  = 2.0/d1;
        var nX = -n*pY;
        var nY = n*pX;

        // upper triangle of symmetric transform matrix
        var a11 = nX*nX - nY*nY
        var a12 = 2*nX*nY;
        var a22 = nY*nY - nX*nX;

        var dX = normalLeft[0] - mid[0];
        var dY = normalLeft[1] - mid[1];

        // coordinates of reflected vector
        var controlX = mid[0] + a11*dX + a12*dY;
        var controlY = mid[1] + a12*dX + a22*dY;
    }
    else{
        controlX = pnt3[0] + t*(pnt2[0] - pnt3[0]);
        controlY = pnt3[1] + t*(pnt2[1] - pnt3[1]);
    }
    return [controlX, controlY];
};

P.PlotUtils.getBezierPoints = function(points){
    if (points.length <= 2)
        return points;

    var bezierPoints=[];
    var n=points.length - 1;
    for (var t=0; t <= 1; t+=0.01){
        var x=y=0;
        for (var index=0; index <= n; index++){
            var factor=P.PlotUtils.getBinomialFactor(n, index);
            var a=Math.pow(t, index);
            var b=Math.pow((1 - t), (n - index));
            x+=factor * a * b * points[index][0];
            y+=factor * a * b * points[index][1];
        }
        bezierPoints.push([x, y]);
    }
    bezierPoints.push(points[n]);
    return bezierPoints;
};

P.PlotUtils.getBinomialFactor = function(n, index){
    return P.PlotUtils.getFactorial(n) / (P.PlotUtils.getFactorial(index) * P.PlotUtils.getFactorial(n - index));
};

P.PlotUtils.getFactorial = function(n){
    if (n <= 1)
        return 1;
    if (n == 2)
        return 2;
    if (n == 3)
        return 6;
    if (n == 4)
        return 24;
    if (n == 5)
        return 120;
    var result=1;
    for (var i=1; i <= n; i++)
        result*=i;
    return result;
};

P.PlotUtils.getQBSplinePoints = function(points){
    if (points.length <= 2 )
        return points;

    var n = 2;

    var bSplinePoints=[];
    var m=points.length - n - 1;
    bSplinePoints.push(points[0]);
    for (var i=0; i <= m; i++){
        for (var t=0; t <= 1; t+=0.05){
            var x=y=0;
            for (var k=0; k <= n; k++){
                var factor=P.PlotUtils.getQuadricBSplineFactor(k, t);
                x+=factor * points[i + k][0];
                y+=factor * points[i + k][1];
            }
            bSplinePoints.push([x, y]);
        }
    }
    bSplinePoints.push(points[points.length - 1]);
    return bSplinePoints;
};

P.PlotUtils.getQuadricBSplineFactor = function(k, t){
    if (k == 0)
        return Math.pow(t - 1, 2) / 2;
    if (k == 1)
        return (-2 * Math.pow(t, 2) + 2 * t + 1) / 2;
    if (k == 2)
        return Math.pow(t, 2) / 2;
    return 0;
};
P.Event = {};

P.Event.EventType = {};

P.Event.EventType.MOUSEMOVE = 'mousemove';
P.Event.EventType.MOUSEUP = 'mouseup';
P.Event.EventType.MOUSEDOWN = 'mousedown';

P.Event.PlotDrawEvent = function(type, feature){
    goog.base(this, type);
    this.feature = feature;
};

goog.inherits(P.Event.PlotDrawEvent, goog.events.Event);

P.Event.PlotDrawEvent.DRAW_START = "draw_start";
P.Event.PlotDrawEvent.DRAW_MOVING = 'draw_moving';
P.Event.PlotDrawEvent.DRAW_END = "draw_end";

P.Event.PlotEditEvent = function(type, feature){
    goog.base(this, type);
    this.feature = feature;
};

goog.inherits(P.Event.PlotEditEvent, goog.events.Event);

P.Event.PlotEditEvent.EDIT_START = "edit_start";
P.Event.PlotEditEvent.EDIT_END = "edit_end";

P.Event.PlotEditEvent.DRAG_POINT_MOVING = 'drag_point_moving';
P.Event.PlotEditEvent.DRAG_POINT_END = 'drag_point_end'
P.Event.PlotEditEvent.DRAG_PLOT_MOVING = 'drag_plot_moving';
P.Event.PlotEditEvent.DRAG_PLOT_END = 'drag_plot_end';

P.Plot = function(points){
    this.setPoints(points);
};

P.Plot.prototype = {

    isPlot: function(){
        return true;
    },

    setPoints: function(value){
        this.points = value ? value : [];
        if(this.points.length>=1)
            this.generate();
    },

    getPoints: function(){
        return this.points.slice(0);
    },

    getPointCount: function(){
        return this.points.length;
    },

    updatePoint: function(point, index){
        if(index>=0 && index<this.points.length){
            this.points[index] = point;
            this.generate();
        }
    },

    updateLastPoint: function(point){
        this.updatePoint(point, this.points.length-1);
    },

    generate: function(){
    },

    finishDrawing: function(){

    }

};



P.Plot.Arc = function(points){
    goog.base(this, []);
    this.type = P.PlotTypes.ARC;
    this.fixPointCount = 3;
    this.setPoints(points);
};

goog.inherits(P.Plot.Arc, ol.geom.LineString);
goog.mixin(P.Plot.Arc.prototype, P.Plot.prototype);

P.Plot.Arc.prototype.generate = function(){
    var count = this.getPointCount();
    if(count < 2){
        return;
    }
    if(count==2) {
        this.setCoordinates(this.points);
    }else{
        var pnt1 = P.PlotUtils.wgsToMercator(this.points[0]);
        var pnt2 =  P.PlotUtils.wgsToMercator(this.points[1]);
        var pnt3 =  P.PlotUtils.wgsToMercator(this.points[2]);
        var center = P.PlotUtils.getCircleCenterOfThreePoints(pnt1, pnt2, pnt3);
        var radius = P.PlotUtils.distance(pnt1, center);

        var angle1 = P.PlotUtils.getAzimuth(pnt1, center);
        var angle2 = P.PlotUtils.getAzimuth(pnt2,center);
        if(P.PlotUtils.isClockWise(pnt1, pnt2, pnt3)){
            var startAngle = angle2;
            var endAngle = angle1;
        }
        else{
            startAngle = angle1;
            endAngle = angle2;
        }
        this.setCoordinates(P.PlotUtils.getArcPoints(center, radius, startAngle, endAngle));
    }
};

P.Plot.AttackArrow = function(points){
    goog.base(this, []);
    this.type = P.PlotTypes.ATTACK_ARROW;
    this.headHeightFactor = 0.18;
    this.headWidthFactor = 0.3;
    this.neckHeightFactor = 0.85;
    this.neckWidthFactor = 0.15;
    this.headTailFactor = 0.8;
    this.setPoints(points);
};

goog.inherits(P.Plot.AttackArrow, ol.geom.Polygon);

goog.mixin(P.Plot.AttackArrow.prototype, P.Plot.prototype);

P.Plot.AttackArrow.prototype.generate = function () {
    if (this.getPointCount() < 2){
        return;
    }
    if (this.getPointCount() == 2) {
        this.setCoordinates([this.points]);
        return;
    }
    var pnts = this.getPoints();
    // 计算箭尾
    var tailLeft = pnts[0];
    var tailRight = pnts[1];
    if (P.PlotUtils.isClockWise(pnts[0], pnts[1], pnts[2])) {
        tailLeft = pnts[1];
        tailRight = pnts[0];
    }
    var midTail = P.PlotUtils.mid(tailLeft, tailRight);
    var bonePnts = [midTail].concat(pnts.slice(2));
    // 计算箭头
    var headPnts = this.getArrowHeadPoints(bonePnts, tailLeft, tailRight);
    var neckLeft = headPnts[0];
    var neckRight = headPnts[4];
    var tailWidthFactor = P.PlotUtils.distance(tailLeft, tailRight) / P.PlotUtils.getBaseLength(bonePnts);
    // 计算箭身
    var bodyPnts = this.getArrowBodyPoints(bonePnts, neckLeft, neckRight, tailWidthFactor);
    // 整合
    var count = bodyPnts.length;
    var leftPnts = [tailLeft].concat(bodyPnts.slice(0, count / 2));
    leftPnts.push(neckLeft);
    var rightPnts = [tailRight].concat(bodyPnts.slice(count / 2, count));
    rightPnts.push(neckRight);

    leftPnts = P.PlotUtils.getQBSplinePoints(leftPnts);
    rightPnts = P.PlotUtils.getQBSplinePoints(rightPnts);

    this.setCoordinates([leftPnts.concat(headPnts, rightPnts.reverse())]);
};

P.Plot.AttackArrow.prototype.getArrowHeadPoints = function (points, tailLeft, tailRight) {
    var len = P.PlotUtils.getBaseLength(points);
    var headHeight = len * this.headHeightFactor;
    var headPnt = points[points.length - 1];
    len = P.PlotUtils.distance(headPnt, points[points.length - 2]);
    var tailWidth = P.PlotUtils.distance(tailLeft, tailRight);
    if (headHeight > tailWidth * this.headTailFactor) {
        headHeight = tailWidth * this.headTailFactor;
    }
    var headWidth = headHeight * this.headWidthFactor;
    var neckWidth = headHeight * this.neckWidthFactor;
    headHeight = headHeight > len ? len : headHeight;
    var neckHeight = headHeight * this.neckHeightFactor;
    var headEndPnt = P.PlotUtils.getThirdPoint(points[points.length - 2], headPnt, 0, headHeight, true);
    var neckEndPnt = P.PlotUtils.getThirdPoint(points[points.length - 2], headPnt, 0, neckHeight, true);
    var headLeft = P.PlotUtils.getThirdPoint(headPnt, headEndPnt, P.Constants.HALF_PI, headWidth, false);
    var headRight = P.PlotUtils.getThirdPoint(headPnt, headEndPnt, P.Constants.HALF_PI, headWidth, true);
    var neckLeft = P.PlotUtils.getThirdPoint(headPnt, neckEndPnt, P.Constants.HALF_PI, neckWidth, false);
    var neckRight = P.PlotUtils.getThirdPoint(headPnt, neckEndPnt, P.Constants.HALF_PI, neckWidth, true);
    return [neckLeft, headLeft, headPnt, headRight, neckRight];
};

P.Plot.AttackArrow.prototype.getArrowBodyPoints = function (points, neckLeft, neckRight, tailWidthFactor) {
    var allLen = P.PlotUtils.wholeDistance(points);
    var len = P.PlotUtils.getBaseLength(points);
    var tailWidth = len * tailWidthFactor;
    var neckWidth = P.PlotUtils.distance(neckLeft, neckRight);
    var widthDif = (tailWidth - neckWidth) / 2;
    var tempLen = 0, leftBodyPnts = [], rightBodyPnts = [];
    for (var i = 1; i < points.length - 1; i++) {
        var angle = P.PlotUtils.getAngleOfThreePoints(points[i - 1], points[i], points[i + 1]) / 2;
        tempLen += P.PlotUtils.distance(points[i - 1], points[i]);
        var w = (tailWidth / 2 - tempLen / allLen * widthDif) / Math.sin(angle);
        var left = P.PlotUtils.getThirdPoint(points[i - 1], points[i], Math.PI - angle, w, true);
        var right = P.PlotUtils.getThirdPoint(points[i - 1], points[i], angle, w, false);
        leftBodyPnts.push(left);
        rightBodyPnts.push(right);
    }
    return leftBodyPnts.concat(rightBodyPnts);
};

P.Plot.SquadCombat = function(points){
    goog.base(this, []);
    this.type = P.PlotTypes.SQUAD_COMBAT;
    this.headHeightFactor = 0.18;
    this.headWidthFactor = 0.3;
    this.neckHeightFactor = 0.85;
    this.neckWidthFactor = 0.15;
    this.tailWidthFactor = 0.1;
    this.setPoints(points);
};

goog.inherits(P.Plot.SquadCombat, P.Plot.AttackArrow);

P.Plot.SquadCombat.prototype.generate = function () {
    var count = this.getPointCount();
    if(count < 2) {
        return;
    }
    var pnts = this.getPoints();
    var tailPnts = this.getTailPoints(pnts);
    var headPnts = this.getArrowHeadPoints(pnts, tailPnts[0], tailPnts[1]);
    var neckLeft = headPnts[0];
    var neckRight = headPnts[4];
    var bodyPnts = this.getArrowBodyPoints(pnts, neckLeft, neckRight, this.tailWidthFactor);
    var count = bodyPnts.length;
    var leftPnts = [tailPnts[0]].concat(bodyPnts.slice(0, count / 2));
    leftPnts.push(neckLeft);
    var rightPnts = [tailPnts[1]].concat(bodyPnts.slice(count / 2, count));
    rightPnts.push(neckRight);

    leftPnts = P.PlotUtils.getQBSplinePoints(leftPnts);
    rightPnts = P.PlotUtils.getQBSplinePoints(rightPnts);

    this.setCoordinates([leftPnts.concat(headPnts, rightPnts.reverse())]);
};

P.Plot.SquadCombat.prototype.getTailPoints = function (points) {
    var allLen = P.PlotUtils.getBaseLength(points);
    var tailWidth = allLen * this.tailWidthFactor;
    var tailLeft = P.PlotUtils.getThirdPoint(points[1], points[0], P.Constants.HALF_PI, tailWidth, false);
    var tailRight = P.PlotUtils.getThirdPoint(points[1], points[0], P.Constants.HALF_PI, tailWidth, true);
    return [tailLeft, tailRight];
};

P.Plot.TailedAttackArrow = function(points){
    goog.base(this, []);
    this.type = P.PlotTypes.TAILED_ATTACK_ARROW;
    this.headHeightFactor = 0.18;
    this.headWidthFactor = 0.3;
    this.neckHeightFactor = 0.85;
    this.neckWidthFactor = 0.15;
    this.tailWidthFactor = 0.1;
    this.headTailFactor = 0.8;
    this.swallowTailFactor = 1;
    this.swallowTailPnt = null;
    this.setPoints(points);
};

goog.inherits(P.Plot.TailedAttackArrow, P.Plot.AttackArrow);

P.Plot.TailedAttackArrow.prototype.generate = function(){
    var count = this.getPointCount();
    if(count < 2) {
        return;
    }
    if(this.getPointCount() == 2){
        this.setCoordinates([this.points]);
        return;
    }
    var pnts = this.getPoints();
    var tailLeft = pnts[0];
    var tailRight = pnts[1];
    if(P.PlotUtils.isClockWise(pnts[0], pnts[1], pnts[2])){
        tailLeft = pnts[1];
        tailRight = pnts[0];
    }
    var midTail = P.PlotUtils.mid(tailLeft, tailRight);
    var bonePnts = [midTail].concat(pnts.slice(2));
    var headPnts = this.getArrowHeadPoints(bonePnts, tailLeft, tailRight);
    var neckLeft = headPnts[0];
    var neckRight = headPnts[4];
    var tailWidth = P.PlotUtils.distance(tailLeft, tailRight);
    var allLen = P.PlotUtils.getBaseLength(bonePnts);
    var len = allLen * this.tailWidthFactor * this.swallowTailFactor;
    this.swallowTailPnt = P.PlotUtils.getThirdPoint(bonePnts[1], bonePnts[0], 0, len, true);
    var factor = tailWidth/allLen;
    var bodyPnts = this.getArrowBodyPoints(bonePnts, neckLeft, neckRight, factor);
    var count = bodyPnts.length;
    var leftPnts = [tailLeft].concat(bodyPnts.slice(0, count/2));
    leftPnts.push(neckLeft);
    var rightPnts = [tailRight].concat(bodyPnts.slice(count/2, count));
    rightPnts.push(neckRight);

    leftPnts = P.PlotUtils.getQBSplinePoints(leftPnts);
    rightPnts = P.PlotUtils.getQBSplinePoints(rightPnts);

    this.setCoordinates([leftPnts.concat(headPnts, rightPnts.reverse(), [this.swallowTailPnt, leftPnts[0]])]);
};

P.Plot.TailedSquadCombat = function(points){
    goog.base(this, []);
    this.type = P.PlotTypes.TAILED_SQUAD_COMBAT;
    this.headHeightFactor = 0.18;
    this.headWidthFactor = 0.3;
    this.neckHeightFactor = 0.85;
    this.neckWidthFactor = 0.15;
    this.tailWidthFactor = 0.1;
    this.swallowTailFactor = 1;
    this.swallowTailPnt = null;
    this.setPoints(points);
};

goog.inherits(P.Plot.TailedSquadCombat, P.Plot.AttackArrow);

P.Plot.TailedSquadCombat.prototype.generate = function () {
    var count = this.getPointCount();
    if(count < 2) {
        return;
    }
    var pnts = this.getPoints();
    var tailPnts = this.getTailPoints(pnts);
    var headPnts = this.getArrowHeadPoints(pnts, tailPnts[0], tailPnts[2]);
    var neckLeft = headPnts[0];
    var neckRight = headPnts[4];
    var bodyPnts = this.getArrowBodyPoints(pnts, neckLeft, neckRight, this.tailWidthFactor);
    var count = bodyPnts.length;
    var leftPnts = [tailPnts[0]].concat(bodyPnts.slice(0, count / 2));
    leftPnts.push(neckLeft);
    var rightPnts = [tailPnts[2]].concat(bodyPnts.slice(count / 2, count));
    rightPnts.push(neckRight);

    leftPnts = P.PlotUtils.getQBSplinePoints(leftPnts);
    rightPnts = P.PlotUtils.getQBSplinePoints(rightPnts);

    this.setCoordinates([leftPnts.concat(headPnts, rightPnts.reverse(), [tailPnts[1], leftPnts[0]])]);
};

P.Plot.TailedSquadCombat.prototype.getTailPoints = function (points) {
    var allLen = P.PlotUtils.getBaseLength(points);
    var tailWidth = allLen * this.tailWidthFactor;
    var tailLeft = P.PlotUtils.getThirdPoint(points[1], points[0], P.Constants.HALF_PI, tailWidth, false);
    var tailRight = P.PlotUtils.getThirdPoint(points[1], points[0], P.Constants.HALF_PI, tailWidth, true);
    var len = tailWidth * this.swallowTailFactor;
    var swallowTailPnt = P.PlotUtils.getThirdPoint(points[1], points[0], 0, len, true);
    return [tailLeft, swallowTailPnt, tailRight];
};

P.Plot.Circle = function(points){
    goog.base(this, []);
    this.type = P.PlotTypes.CIRCLE;
    this.fixPointCount = 2;
    this.setPoints(points);
}

goog.inherits(P.Plot.Circle, ol.geom.Polygon);

goog.mixin(P.Plot.Circle.prototype, P.Plot.prototype);

P.Plot.Circle.prototype.generate = function(){
    var count = this.getPointCount();
    if(count < 2) {
        return;
    }
    var center = this.points[0];
    var radius = P.PlotUtils.distance(P.PlotUtils.wgsToMercator(center), P.PlotUtils.wgsToMercator(this.points[1]));
    this.setCoordinates([this.generatePoints(P.PlotUtils.wgsToMercator(center), radius)]);
};

P.Plot.Circle.prototype.generatePoints = function(center, radius){
    var x, y, angle, points=[];
    for(var i=0; i<= P.Constants.FITTING_COUNT; i++){
        angle = Math.PI*2*i/ P.Constants.FITTING_COUNT;
        x = center[0] + radius*Math.cos(angle);
        y = center[1] + radius*Math.sin(angle);
        points.push(P.PlotUtils.mercatorToWGS([x,y]));
    }
    return points;
};



P.Plot.ClosedCurve = function(points){
    goog.base(this, []);
    this.type = P.PlotTypes.CLOSED_CURVE;
    this.t = 0.3;
    this.setPoints(points);
};

goog.inherits(P.Plot.ClosedCurve, ol.geom.Polygon);
goog.mixin(P.Plot.ClosedCurve.prototype, P.Plot.prototype);

P.Plot.ClosedCurve.prototype.generate = function(){
    var count = this.getPointCount();
    if(count < 2) {
        return;
    }
    if(count == 2) {
        this.setCoordinates([this.points]);
    }
    else{
        var pnts = this.getPoints();
        pnts.push(pnts[0], pnts[1]);
        var normals = [];
        for(var i=0; i<pnts.length-2; i++){
            var normalPoints = P.PlotUtils.getBisectorNormals(this.t, pnts[i], pnts[i+1], pnts[i+2]);
            normals = normals.concat(normalPoints);
        }
        var count = normals.length;
        normals = [normals[count-1]].concat(normals.slice(0, count-1));

        var pList = [];
        for(i=0; i<pnts.length-2; i++){
            var pnt1 = pnts[i];
            var pnt2 = pnts[i+1];
            pList.push(pnt1);
            for(var t=0; t<= P.Constants.FITTING_COUNT; t++){
                var pnt = P.PlotUtils.getCubicValue(t/ P.Constants.FITTING_COUNT, pnt1, normals[i*2], normals[i*2+1], pnt2);
                pList.push(pnt);
            }
            pList.push(pnt2);
        }
        this.setCoordinates([pList]);
    }
};

P.Plot.Curve = function(points){
    goog.base(this, []);
    this.type = P.PlotTypes.CURVE;
    this.t = 0.3;
    this.setPoints(points);
};

goog.inherits(P.Plot.Curve, ol.geom.LineString);

goog.mixin(P.Plot.Curve.prototype, P.Plot.prototype);

P.Plot.Curve.prototype.generate = function(){
    var count = this.getPointCount();
    if(count < 2) {
        return;
    }
    if(count == 2) {
        this.setCoordinates(this.points);
    } else {
        this.setCoordinates(P.PlotUtils.getCurvePoints(this.t, this.points));
    }
};

P.Plot.DoubleArrow = function(points){
    goog.base(this, []);
    this.type = P.PlotTypes.DOUBLE_ARROW;
    this.headHeightFactor = 0.25;
    this.headWidthFactor = 0.3;
    this.neckHeightFactor = 0.85;
    this.neckWidthFactor = 0.15;
    this.connPoint = null;
    this.tempPoint4 = null;
    this.fixPointCount = 4;
    this.setPoints(points);
};

goog.inherits(P.Plot.DoubleArrow, ol.geom.Polygon);

goog.mixin(P.Plot.DoubleArrow.prototype, P.Plot.prototype);

P.Plot.DoubleArrow.prototype.finishDrawing = function(){
    if(this.getPointCount()==3 && this.tempPoint4!=null)
        this.points.push(this.tempPoint4);
    if(this.connPoint!=null)
        this.points.push(this.connPoint);
};

P.Plot.DoubleArrow.prototype.generate = function(){
    var count = this.getPointCount();
    if(count<2) {
        return;
    }
    if(count == 2){
        this.setCoordinates([this.points]);
        return;
    }
    var pnt1 = this.points[0];
    var pnt2 = this.points[1];
    var pnt3 = this.points[2];
    var count = this.getPointCount();
    if(count == 3)
        this.tempPoint4 = this.getTempPoint4(pnt1, pnt2, pnt3);
    else
        this.tempPoint4 = this.points[3];
    if(count==3 || count==4)
        this.connPoint = P.PlotUtils.mid(pnt1, pnt2);
    else
        this.connPoint = this.points[4];
    var leftArrowPnts, rightArrowPnts;
    if(P.PlotUtils.isClockWise(pnt1, pnt2, pnt3)){
        leftArrowPnts = this.getArrowPoints(pnt1, this.connPoint, this.tempPoint4, false);
        rightArrowPnts = this.getArrowPoints(this.connPoint, pnt2, pnt3, true);
    }else{
        leftArrowPnts = this.getArrowPoints(pnt2, this.connPoint, pnt3, false);
        rightArrowPnts = this.getArrowPoints(this.connPoint, pnt1, this.tempPoint4, true);
    }
    var m = leftArrowPnts.length;
    var t = (m - 5) / 2;

    var llBodyPnts = leftArrowPnts.slice(0 ,t);
    var lArrowPnts = leftArrowPnts.slice(t, t+5);
    var lrBodyPnts = leftArrowPnts.slice(t+5, m);

    var rlBodyPnts = rightArrowPnts.slice(0 ,t);
    var rArrowPnts = rightArrowPnts.slice(t, t+5);
    var rrBodyPnts = rightArrowPnts.slice(t+5, m);

    rlBodyPnts = P.PlotUtils.getBezierPoints(rlBodyPnts);
    var bodyPnts = P.PlotUtils.getBezierPoints(rrBodyPnts.concat(llBodyPnts.slice(1)));
    lrBodyPnts = P.PlotUtils.getBezierPoints(lrBodyPnts);

    var pnts = rlBodyPnts.concat(rArrowPnts, bodyPnts, lArrowPnts, lrBodyPnts);
    this.setCoordinates([pnts]);
};

P.Plot.DoubleArrow.prototype.getArrowPoints = function(pnt1, pnt2, pnt3, clockWise){
    var midPnt=P.PlotUtils.mid(pnt1, pnt2);
    var len=P.PlotUtils.distance(midPnt, pnt3);
    var midPnt1=P.PlotUtils.getThirdPoint(pnt3, midPnt, 0, len * 0.3, true);
    var midPnt2=P.PlotUtils.getThirdPoint(pnt3, midPnt, 0, len * 0.5, true);
    //var midPnt3=PlotUtils.getThirdPoint(pnt3, midPnt, 0, len * 0.7, true);
    midPnt1=P.PlotUtils.getThirdPoint(midPnt, midPnt1, P.Constants.HALF_PI, len / 5, clockWise);
    midPnt2=P.PlotUtils.getThirdPoint(midPnt, midPnt2, P.Constants.HALF_PI, len / 4, clockWise);
    //midPnt3=PlotUtils.getThirdPoint(midPnt, midPnt3, Constants.HALF_PI, len / 5, clockWise);

    var points=[midPnt, midPnt1, midPnt2, pnt3];
    // 计算箭头部分
    var arrowPnts=this.getArrowHeadPoints(points, this.headHeightFactor, this.headWidthFactor, this.neckHeightFactor, this.neckWidthFactor);
    var neckLeftPoint=arrowPnts[0];
    var neckRightPoint=arrowPnts[4];
    // 计算箭身部分
    var tailWidthFactor=P.PlotUtils.distance(pnt1, pnt2) / P.PlotUtils.getBaseLength(points) / 2;
    var bodyPnts=this.getArrowBodyPoints(points, neckLeftPoint, neckRightPoint, tailWidthFactor);
    var n=bodyPnts.length;
    var lPoints=bodyPnts.slice(0, n / 2);
    var rPoints=bodyPnts.slice(n / 2, n);
    lPoints.push(neckLeftPoint);
    rPoints.push(neckRightPoint);
    lPoints=lPoints.reverse();
    lPoints.push(pnt2);
    rPoints=rPoints.reverse();
    rPoints.push(pnt1);
    return lPoints.reverse().concat(arrowPnts, rPoints);
};

P.Plot.DoubleArrow.prototype.getArrowHeadPoints = function(points, tailLeft, tailRight){
    var len = P.PlotUtils.getBaseLength(points);
    var headHeight = len * this.headHeightFactor;
    var headPnt = points[points.length-1];
    var tailWidth = P.PlotUtils.distance(tailLeft, tailRight);
    var headWidth = headHeight * this.headWidthFactor;
    var neckWidth = headHeight * this.neckWidthFactor;
    var neckHeight = headHeight * this.neckHeightFactor;
    var headEndPnt = P.PlotUtils.getThirdPoint(points[points.length-2], headPnt, 0, headHeight, true);
    var neckEndPnt = P.PlotUtils.getThirdPoint(points[points.length-2], headPnt, 0, neckHeight, true);
    var headLeft = P.PlotUtils.getThirdPoint(headPnt, headEndPnt, P.Constants.HALF_PI, headWidth, false);
    var headRight = P.PlotUtils.getThirdPoint(headPnt, headEndPnt, P.Constants.HALF_PI, headWidth, true);
    var neckLeft = P.PlotUtils.getThirdPoint(headPnt, neckEndPnt, P.Constants.HALF_PI, neckWidth, false);
    var neckRight = P.PlotUtils.getThirdPoint(headPnt, neckEndPnt, P.Constants.HALF_PI, neckWidth, true);
    return [neckLeft, headLeft, headPnt, headRight, neckRight];
};

P.Plot.DoubleArrow.prototype.getArrowBodyPoints = function(points, neckLeft, neckRight, tailWidthFactor){
    var allLen = P.PlotUtils.wholeDistance(points);
    var len = P.PlotUtils.getBaseLength(points);
    var tailWidth = len * tailWidthFactor;
    var neckWidth = P.PlotUtils.distance(neckLeft, neckRight);
    var widthDif = (tailWidth - neckWidth) / 2;
    var tempLen = 0, leftBodyPnts=[], rightBodyPnts = [];
    for(var i=1; i<points.length-1; i++){
        var angle=P.PlotUtils.getAngleOfThreePoints(points[i-1], points[i], points[i+1]) / 2;
        tempLen += P.PlotUtils.distance(points[i-1], points[i]);
        var w = (tailWidth/2 - tempLen / allLen * widthDif) / Math.sin(angle);
        var left = P.PlotUtils.getThirdPoint(points[i-1], points[i], Math.PI-angle, w, true);
        var right = P.PlotUtils.getThirdPoint(points[i-1], points[i], angle, w, false);
        leftBodyPnts.push(left);
        rightBodyPnts.push(right);
    }
    return leftBodyPnts.concat(rightBodyPnts);
};

// 计算对称点
P.Plot.DoubleArrow.prototype.getTempPoint4 = function(linePnt1, linePnt2, point){
    var midPnt=P.PlotUtils.mid(linePnt1, linePnt2);
    var len=P.PlotUtils.distance(midPnt, point);
    var angle=P.PlotUtils.getAngleOfThreePoints(linePnt1, midPnt, point);
    var symPnt, distance1, distance2, mid;
    if (angle < P.Constants.HALF_PI)
    {
        distance1=len * Math.sin(angle);
        distance2=len * Math.cos(angle);
        mid=P.PlotUtils.getThirdPoint(linePnt1, midPnt, P.Constants.HALF_PI, distance1, false);
        symPnt=P.PlotUtils.getThirdPoint(midPnt, mid, P.Constants.HALF_PI, distance2, true);
    }
    else if (angle >= P.Constants.HALF_PI && angle < Math.PI)
    {
        distance1=len * Math.sin(Math.PI - angle);
        distance2=len * Math.cos(Math.PI - angle);
        mid=P.PlotUtils.getThirdPoint(linePnt1, midPnt, P.Constants.HALF_PI, distance1, false);
        symPnt=P.PlotUtils.getThirdPoint(midPnt, mid, P.Constants.HALF_PI, distance2, false);
    }
    else if (angle >= Math.PI && angle < Math.PI * 1.5)
    {
        distance1=len * Math.sin(angle - Math.PI);
        distance2=len * Math.cos(angle - Math.PI);
        mid=P.PlotUtils.getThirdPoint(linePnt1, midPnt, P.Constants.HALF_PI, distance1, true);
        symPnt=P.PlotUtils.getThirdPoint(midPnt, mid, P.Constants.HALF_PI, distance2, true);
    }
    else
    {
        distance1=len * Math.sin(Math.PI * 2 - angle);
        distance2=len * Math.cos(Math.PI * 2 - angle);
        mid=P.PlotUtils.getThirdPoint(linePnt1, midPnt, P.Constants.HALF_PI, distance1, true);
        symPnt=P.PlotUtils.getThirdPoint(midPnt, mid, P.Constants.HALF_PI, distance2, false);
    }
    return symPnt;
};


P.Plot.Ellipse = function(points){
    goog.base(this, []);
    this.type = P.PlotTypes.ELLIPSE;
    this.fixPointCount = 2;
    this.setPoints(points);
};

goog.inherits(P.Plot.Ellipse, ol.geom.Polygon);

goog.mixin(P.Plot.Ellipse.prototype, P.Plot.prototype);

P.Plot.Ellipse.prototype.generate = function(){
    var count = this.getPointCount();
    if(count < 2) {
        return;
    }
    var pnt1 =P.PlotUtils.wgsToMercator(this.points[0]);
    var pnt2 = P.PlotUtils.wgsToMercator(this.points[1]);
    var center = P.PlotUtils.mid(pnt1, pnt2);
    var majorRadius = Math.abs((pnt1[0]-pnt2[0])/2);
    var minorRadius = Math.abs((pnt1[1]-pnt2[1])/2);
    this.setCoordinates([this.generatePoints(center, majorRadius, minorRadius)]);
};

P.Plot.Ellipse.prototype.generatePoints = function(center, majorRadius, minorRadius) {
    var x, y, angle, points = [];
    for (var i = 0; i <= P.Constants.FITTING_COUNT; i++) {
        angle = Math.PI * 2 * i / P.Constants.FITTING_COUNT;
        x = center[0] + majorRadius * Math.cos(angle);
        y = center[1] + minorRadius * Math.sin(angle);
        points.push([P.PlotUtils.mercatorToWGS([x, y])[0],P.PlotUtils.mercatorToWGS([x, y])[1]]);
    }
    return points;
};



P.Plot.FineArrow = function(points){
    goog.base(this, []);
    this.type = P.PlotTypes.FINE_ARROW;
    this.tailWidthFactor = 0.15;
    this.neckWidthFactor = 0.2;
    this.headWidthFactor = 0.25;
    this.headAngle = Math.PI / 8.5;
    this.neckAngle = Math.PI / 13;
    this.fixPointCount = 2;
    this.setPoints(points);
}

goog.inherits(P.Plot.FineArrow, ol.geom.Polygon);

goog.mixin(P.Plot.FineArrow.prototype, P.Plot.prototype);

P.Plot.FineArrow.prototype.generate = function(){
    var count = this.getPointCount();
    if(count < 2) {
        return;
    }
    var pnts = this.getPoints();
    var pnt1 = pnts[0];
    var pnt2 = pnts[1];
    var len = P.PlotUtils.getBaseLength(pnts);
    var tailWidth = len * this.tailWidthFactor;
    var neckWidth = len * this.neckWidthFactor;
    var headWidth = len * this.headWidthFactor;
    var tailLeft = P.PlotUtils.getThirdPoint(pnt2, pnt1, P.Constants.HALF_PI, tailWidth, true);
    var tailRight = P.PlotUtils.getThirdPoint(pnt2, pnt1, P.Constants.HALF_PI, tailWidth, false);
    var headLeft = P.PlotUtils.getThirdPoint(pnt1, pnt2, this.headAngle, headWidth, false);
    var headRight = P.PlotUtils.getThirdPoint(pnt1, pnt2, this.headAngle, headWidth, true);
    var neckLeft = P.PlotUtils.getThirdPoint(pnt1, pnt2, this.neckAngle, neckWidth, false);
    var neckRight = P.PlotUtils.getThirdPoint(pnt1, pnt2, this.neckAngle, neckWidth, true);
    var pList = [tailLeft, neckLeft, headLeft, pnt2, headRight, neckRight, tailRight];
    this.setCoordinates([pList]);
};

P.Plot.AssaultDirection = function(points){
    goog.base(this, []);
    this.type = P.PlotTypes.ASSAULT_DIRECTION;
    this.tailWidthFactor = 0.2;
    this.neckWidthFactor = 0.25;
    this.headWidthFactor = 0.3;
    this.headAngle = Math.PI / 4;
    this.neckAngle = Math.PI * 0.17741;
    this.setPoints(points);
};

goog.inherits(P.Plot.AssaultDirection, P.Plot.FineArrow);

P.Plot.GatheringPlace = function(points){
    goog.base(this, []);
    this.type = P.PlotTypes.GATHERING_PLACE;
    this.t = 0.4;
    this.fixPointCount = 3;
    this.setPoints(points);
}

goog.inherits(P.Plot.GatheringPlace, ol.geom.Polygon);

goog.mixin(P.Plot.GatheringPlace.prototype, P.Plot.prototype);

P.Plot.GatheringPlace.prototype.generate = function(){
    var pnts = this.getPoints();
    if(pnts.length<2){
        return;
    }
    if(this.getPointCount()==2){
        var mid = P.PlotUtils.mid(pnts[0], pnts[1]);
        var d = P.PlotUtils.distance(pnts[0], mid)/0.9;
        var pnt = P.PlotUtils.getThirdPoint(pnts[0], mid, P.Constants.HALF_PI, d, true);
        pnts = [pnts[0], pnt, pnts[1]];
    }
    var mid = P.PlotUtils.mid(pnts[0], pnts[2]);
    pnts.push(mid, pnts[0], pnts[1]);

    var normals = [];
    for(var i=0; i<pnts.length-2; i++){
        var pnt1 = pnts[i];
        var pnt2 = pnts[i+1];
        var pnt3 = pnts[i+2];
        var normalPoints = P.PlotUtils.getBisectorNormals(this.t, pnt1, pnt2, pnt3);
        normals = normals.concat(normalPoints);
    }
    var count = normals.length;
    normals = [normals[count-1]].concat(normals.slice(0, count-1));
    var pList = [];
    for(i=0; i<pnts.length-2; i++){
        pnt1 = pnts[i];
        pnt2 = pnts[i+1];
        pList.push(pnt1);
        for(var t=0; t<=P.Constants.FITTING_COUNT; t++){
            var pnt = P.PlotUtils.getCubicValue(t/P.Constants.FITTING_COUNT, pnt1, normals[i*2], normals[i*2+1], pnt2);
            pList.push(pnt);
        }
        pList.push(pnt2);
    }
    this.setCoordinates([pList]);
};

P.Plot.Lune = function(points){
    goog.base(this, []);
    this.type = P.PlotTypes.LUNE;
    this.fixPointCount = 3;
    this.setPoints(points);
};

goog.inherits(P.Plot.Lune, ol.geom.Polygon);

goog.mixin(P.Plot.Lune.prototype, P.Plot.prototype);

P.Plot.Lune.prototype.generate = function(){
    if(this.getPointCount()<2) {
        return;
    }
    var pnts = this.getPoints();
    if(this.getPointCount()==2){
        var mid = P.PlotUtils.mid(P.PlotUtils.wgsToMercator(pnts[0]),P.PlotUtils.wgsToMercator(pnts[1]));
        var d = P.PlotUtils.distance(P.PlotUtils.wgsToMercator(pnts[0]), mid);
        var pnt = P.PlotUtils.getThirdPoint(P.PlotUtils.wgsToMercator(pnts[0]), mid, P.Constants.HALF_PI, d);
        pnts.push(pnt);
    }
    var pnt1 = P.PlotUtils.wgsToMercator(pnts[0]);
    var pnt2 = P.PlotUtils.wgsToMercator(pnts[1]);
    var pnt3 = P.PlotUtils.wgsToMercator(pnts[2]);
    var center = P.PlotUtils.getCircleCenterOfThreePoints(pnt1, pnt2, pnt3);
    var radius = P.PlotUtils.distance(pnt1, center);

    var angle1 = P.PlotUtils.getAzimuth(pnt1, center);
    var angle2 = P.PlotUtils.getAzimuth(pnt2, center);
    if(P.PlotUtils.isClockWise(pnt1, pnt2, pnt3)){
        var startAngle = angle2;
        var endAngle = angle1;
    }
    else{
        startAngle = angle1;
        endAngle = angle2;
    }
    var pnts = P.PlotUtils.getArcPoints(center, radius, startAngle, endAngle);
    pnts.push(pnts[0]);
    this.setCoordinates([pnts]);
};

P.Plot.Sector = function(points){
    goog.base(this, []);
    this.type = P.PlotTypes.SECTOR;
    this.fixPointCount = 3;
    this.setPoints(points);
};

goog.inherits(P.Plot.Sector, ol.geom.Polygon);

goog.mixin(P.Plot.Sector.prototype, P.Plot.prototype);

P.Plot.Sector.prototype.generate = function(){
    if(this.getPointCount()<2)
        return;
    if(this.getPointCount()==2)
        this.setCoordinates([this.points]);
    else{
        var pnts = this.getPoints();
        var center = pnts[0];
        var pnt2 = pnts[1];
        var pnt3 = pnts[2];
        var radius = P.PlotUtils.distance(P.PlotUtils.wgsToMercator(pnt2), P.PlotUtils.wgsToMercator(center));
        var startAngle = P.PlotUtils.getAzimuth(P.PlotUtils.wgsToMercator(pnt2), P.PlotUtils.wgsToMercator(center));
        var endAngle = P.PlotUtils.getAzimuth(P.PlotUtils.wgsToMercator(pnt3), P.PlotUtils.wgsToMercator(center));
        var pList = P.PlotUtils.getArcPoints(P.PlotUtils.wgsToMercator(center), radius, startAngle, endAngle);
        pList.push(center, pList[0]);
        this.setCoordinates([pList]);
    }
};

P.Plot.StraightArrow = function(points){
    goog.base(this, []);
    this.type = P.PlotTypes.STRAIGHT_ARROW;
    this.fixPointCount = 2;
    this.maxArrowLength = 3000000;
    this.arrowLengthScale = 5;
    this.setPoints(points);
};

goog.inherits(P.Plot.StraightArrow,ol.geom.LineString);

goog.mixin(P.Plot.StraightArrow.prototype, P.Plot.prototype);

P.Plot.StraightArrow.prototype.generate = function(){
    if(this.getPointCount()<2) {
        return;
    }
    var pnts = this.getPoints();
    var pnt1 = pnts[0];
    var pnt2 = pnts[1];
    var distance = P.PlotUtils.distance(pnt1, pnt2);
    var len = distance / this.arrowLengthScale;
    len = len > this.maxArrowLength ? this.maxArrowLength : len;
    var leftPnt = P.PlotUtils.getThirdPoint(pnt1, pnt2, Math.PI/6, len, false);
    var rightPnt = P.PlotUtils.getThirdPoint(pnt1, pnt2, Math.PI/6, len, true);
    this.setCoordinates([pnt1, pnt2, leftPnt, pnt2, rightPnt]);
};

P.Plot.Polyline = function(points){
    goog.base(this, []);
    this.type = P.PlotTypes.POLYLINE;
    this.setPoints(points);
};

goog.inherits(P.Plot.Polyline, ol.geom.LineString);

goog.mixin(P.Plot.Polyline.prototype, P.Plot.prototype);

P.Plot.Polyline.prototype.generate = function(){
    var count = this.getPointCount();
    if(count < 2) {
        return;
    }
    this.setCoordinates(this.points);
};

P.Plot.FreehandLine = function(points){
    goog.base(this, []);
    this.type = P.PlotTypes.FREEHAND_LINE;
    this.freehand =  true;
    this.setPoints(points);
};

goog.inherits(P.Plot.FreehandLine, ol.geom.LineString);

goog.mixin(P.Plot.FreehandLine.prototype, P.Plot.prototype);

P.Plot.FreehandLine.prototype.generate = function(){
    var count = this.getPointCount();
    if(count < 2) {
        return;
    }
    this.setCoordinates(this.points);
};

P.Plot.Polygon = function(points){
    goog.base(this, []);
    this.type = P.PlotTypes.POLYGON;
    this.setPoints(points);
};

goog.inherits(P.Plot.Polygon, ol.geom.Polygon);

goog.mixin(P.Plot.Polygon.prototype, P.Plot.prototype);

P.Plot.Polygon.prototype.generate = function() {
    var count = this.getPointCount();
    if(count < 2) {
        return;
    }
    this.setCoordinates([this.points]);
};

P.Plot.Marker = function(points){
    goog.base(this, [0,0]);
    this.type = P.PlotTypes.MARKER;
    this.fixPointCount = 1;
    this.setPoints(points);
}

goog.inherits(P.Plot.Marker, ol.geom.Point);

goog.mixin(P.Plot.Marker.prototype, P.Plot.prototype);

P.Plot.Marker.prototype.generate = function(){
    var pnt = this.points[0];
    this.setCoordinates(pnt);
};



P.Plot.Rectangle = function(points){
    goog.base(this, []);
    this.type = P.PlotTypes.RECTANGLE;
    this.fixPointCount = 2;
    this.setPoints(points);
};

goog.inherits(P.Plot.Rectangle, ol.geom.Polygon);

goog.mixin(P.Plot.Rectangle.prototype, P.Plot.prototype);

P.Plot.Rectangle.prototype.generate = function(){
    var count = this.getPointCount();
    if(count<2) {
        return;
    }else{
        var pnt1 = this.points[0];
        var pnt2 = this.points[1];
        var xmin = Math.min(pnt1[0], pnt2[0]);
        var xmax = Math.max(pnt1[0], pnt2[0]);
        var ymin = Math.min(pnt1[1], pnt2[1]);
        var ymax = Math.max(pnt1[1], pnt2[1]);
        var tl = [xmin, ymax];
        var tr = [xmax, ymax];
        var br = [xmax, ymin];
        var bl = [xmin, ymin];
        this.setCoordinates([[tl, tr, br, bl]]);
    }
};

P.Plot.FreehandPolygon = function(points){
    goog.base(this, []);
    this.type = P.PlotTypes.FREEHAND_POLYGON;
    this.freehand = true;
    this.setPoints(points);
};

goog.inherits(P.Plot.FreehandPolygon, ol.geom.Polygon);

goog.mixin(P.Plot.FreehandPolygon.prototype, P.Plot.prototype);

P.Plot.FreehandPolygon.prototype.generate = function() {
    var count = this.getPointCount();
    if(count < 2) {
        return;
    }
    this.setCoordinates([this.points]);
};

P.PlotFactory = {};

P.PlotFactory.createPlot = function(type, points){
    switch(type){
        case P.PlotTypes.ARC:
            return new P.Plot.Arc(points);
        case P.PlotTypes.ELLIPSE:
            return new P.Plot.Ellipse(points);
        case P.PlotTypes.CURVE:
            return new P.Plot.Curve(points);
        case P.PlotTypes.CLOSED_CURVE:
            return new P.Plot.ClosedCurve(points);
        case P.PlotTypes.LUNE:
            return new P.Plot.Lune(points);
        case P.PlotTypes.SECTOR:
            return new P.Plot.Sector(points);
        case P.PlotTypes.GATHERING_PLACE:
            return new P.Plot.GatheringPlace(points);
        case P.PlotTypes.STRAIGHT_ARROW:
            return new P.Plot.StraightArrow(points);
        case P.PlotTypes.ASSAULT_DIRECTION:
            return new P.Plot.AssaultDirection(points);
        case P.PlotTypes.ATTACK_ARROW:
            return new P.Plot.AttackArrow(points);
        case P.PlotTypes.FINE_ARROW:
            return new P.Plot.FineArrow(points);
        case P.PlotTypes.CIRCLE:
            return new P.Plot.Circle(points);
        case P.PlotTypes.DOUBLE_ARROW:
            return new P.Plot.DoubleArrow(points);
        case P.PlotTypes.TAILED_ATTACK_ARROW:
            return new P.Plot.TailedAttackArrow(points);
        case P.PlotTypes.SQUAD_COMBAT:
            return new P.Plot.SquadCombat(points);
        case P.PlotTypes.TAILED_SQUAD_COMBAT:
            return new P.Plot.TailedSquadCombat(points);
        case P.PlotTypes.FREEHAND_LINE:
            return new P.Plot.FreehandLine(points);
        case P.PlotTypes.FREEHAND_POLYGON:
            return new P.Plot.FreehandPolygon(points);
        case P.PlotTypes.POLYGON:
            return new P.Plot.Polygon(points);
        case P.PlotTypes.MARKER:
            return new P.Plot.Marker(points);
        case P.PlotTypes.RECTANGLE:
            return new P.Plot.Rectangle(points);
        case P.PlotTypes.POLYLINE:
            return new P.Plot.Polyline(points);
    }
    return null;
}

P.PlotDraw = function(map){
    goog.base(this, []);
    this.points = null;
    this.plot = null;
    this.feature = null;
    this.plotType = null;
    this.plotParams = null;
    this.mapViewport = null;
    this.dblClickZoomInteraction = null;
    // change ol --> mapbox
    // var stroke = new ol.style.Stroke({color: '#000000', width: 1.25});
    // var fill = new ol.style.Fill({color: 'rgba(0,0,0,0.4)'});
    // this.style = new ol.style.Style({fill:fill, stroke:stroke});
    // this.featureSource = new ol.source.Vector();
    // this.drawOverlay = new ol.layer.Vector({
    //     source: this.featureSource
    // });
    // this.drawOverlay.setStyle(this.style);
    //
    this.featureSourceID = 'plot-draw-source-point'
    this.featureSource = {
        'type':'geojson',
        'data':{
            'type':'Feature',
            "geometry": {
                "type": "Point",
                "coordinates": []
            }
        }
    }
    this.drawOverlay = {
        'id':'plot-draw-overlayer-point-layer',
        'source':'plot-draw-source-point',
        'type': 'circle',
        'paint':{
            "circle-radius": 4,
            "circle-color": "#B42222"
        }
    }
    this.setMap(map);
};

goog.inherits(P.PlotDraw, ol.Observable);

P.PlotDraw.prototype.activate = function (type, params) {
    this.deactivate();
    this.deactivateMapTools();
    window._PlotDraw = this
    this.map.on("click", this.mapFirstClickHandler);
    this.plotType = type;
    this.plotParams = params;
    this.map.addSource(this.featureSourceID,this.featureSource)
    this.map.addLayer(this.drawOverlay);
};

P.PlotDraw.prototype.deactivate = function () {
    this.disconnectEventHandlers();
    if(this.map.getLayer(this.drawOverlay.id)){
        this.map.removeLayer(this.drawOverlay.id);
        this.map.removeSource('plot-draw-source-point')
    }
    // this.featureSource.clear();
    this.points = [];
    this.plot = null;
    this.feature = null;
    this.plotType = null;
    this.plotParams = null;
    this.activateMapTools();
};

P.PlotDraw.prototype.isDrawing = function(){
    return this.plotType != null;
};

P.PlotDraw.prototype.setMap = function (value) {
    this.map = value;
    //change
    this.mapViewport = this.map.getCanvasContainer();
};

P.PlotDraw.prototype.mapFirstClickHandler = function (e) {
    //change
    window._PlotDraw.points.push([e.lngLat.lng,e.lngLat.lat]);
    window._PlotDraw.plot = P.PlotFactory.createPlot(window._PlotDraw.plotType, window._PlotDraw.points, window._PlotDraw.plotParams);
    // this.feature = new ol.Feature(this.plot);
    window._PlotDraw.feature = window._PlotDraw.plot;
    // this.featureSource.addFeature(this.feature);
    //change
    window._PlotDraw.map.off("click", window._PlotDraw.mapFirstClickHandler);
    //
    if (window._PlotDraw.plot.fixPointCount == window._PlotDraw.plot.getPointCount()) {
        window._PlotDraw.mapDoubleClickHandler(e);
        return;
    }
    //
    window._PlotDraw.map.on("click", window._PlotDraw.mapNextClickHandler);
    if(!window._PlotDraw.plot.freehand){
        window._PlotDraw.map.on("dblclick", window._PlotDraw.mapDoubleClickHandler);
    }
    goog.events.listen(window._PlotDraw.mapViewport, P.Event.EventType.MOUSEMOVE,
        window._PlotDraw.mapMouseMoveHandler, false, window._PlotDraw);
};

P.PlotDraw.prototype.mapMouseMoveHandler = function (e) {
    //change
    // var coordinate = map.getCoordinateFromPixel([e.offsetX, e.offsetY]);
    var coor = this.map.unproject([e.offsetX,e.offsetY])
    var pixCoordinate =  this.map.project([coor.lng,coor.lat])
    var coordinate = [coor.lng,coor.lat]
    if (P.PlotUtils.distance([coor.lng,coor.lat], this.points[this.points.length - 1]) < P.Constants.ZERO_TOLERANCE)
        return;

    if(!this.plot.freehand){
        var pnts = this.points.concat([coordinate]);
        this.plot.setPoints(pnts);
    }else{
        this.points.push(coordinate);
        this.plot.setPoints(this.points);
    }
    var data = JSON.parse(JSON.stringify({
        type: 'Feature',
        properties: {},
        geometry: {
            coordinates: P.Utils.handleArray(this.feature.A,P.Utils.getFeatureType(this.feature.type)),
            type:P.Utils.getFeatureType(this.feature.type)
        }
    }))
    this.dispatchEvent(new P.Event.PlotDrawEvent(P.Event.PlotDrawEvent.DRAW_MOVING, data));
};

P.PlotDraw.prototype.mapNextClickHandler = function (e) {
    var coordinate = [e.lngLat.lng,e.lngLat.lat]
    if(! window._PlotDraw.plot.freehand){
        if (P.PlotUtils.distance(coordinate,  window._PlotDraw.points[ window._PlotDraw.points.length - 1]) < P.Constants.ZERO_TOLERANCE)
            return;
    }
    window._PlotDraw.points.push(coordinate);
    window._PlotDraw.plot.setPoints( window._PlotDraw.points);
    if ( window._PlotDraw.plot.fixPointCount ==  window._PlotDraw.plot.getPointCount()) {
        window._PlotDraw.mapDoubleClickHandler(e);
        return;
    }
    if( window._PlotDraw.plot &&  window._PlotDraw.plot.freehand){
        window._PlotDraw.mapDoubleClickHandler(e);
    }
};

P.PlotDraw.prototype.mapDoubleClickHandler = function (e) {
    window._PlotDraw.disconnectEventHandlers();
    window._PlotDraw.plot.finishDrawing();
    e.preventDefault();
    window._PlotDraw.drawEnd();
};

P.PlotDraw.prototype.disconnectEventHandlers = function () {
    // change
    this.map.off("click", this.mapFirstClickHandler);
    this.map.off("click", this.mapNextClickHandler);
    goog.events.unlisten(this.mapViewport, P.Event.EventType.MOUSEMOVE,
        this.mapMouseMoveHandler, false, this);
    this.map.off("dblclick", this.mapDoubleClickHandler);
};

P.PlotDraw.prototype.drawEnd = function (feature) {

    var data = JSON.parse(JSON.stringify({
        type: 'Feature',
        properties: {
            id: P.Utils.uuid(),
            coordinates: this.feature.points,     //锚点坐标
            isplot:true,
            plotType:this.plotType // 标绘类型
        },
        geometry: {
            coordinates: P.Utils.handleArray(this.feature.A,P.Utils.getFeatureType(this.feature.type)),
            type:P.Utils.getFeatureType(this.feature.type)
        }
    }))
    this.activateMapTools();
    this.disconnectEventHandlers();
    if(this.map.getLayer(this.drawOverlay.id)){
        this.map.removeLayer(this.drawOverlay.id);
        this.map.removeSource('plot-draw-source-point')
    }
    this.points = [];
    this.plot = null;
    this.plotType = null;
    this.plotParams = null;
    this.dispatchEvent(new P.Event.PlotDrawEvent(P.Event.PlotDrawEvent.DRAW_END, data));
    this.feature = null;
};

P.PlotDraw.prototype.deactivateMapTools = function () {
    // var interactions = map.getInteractions();
    // var length = interactions.getLength();
    // for (var i = 0; i < length; i++) {
    //     var item = interactions.item(i);
    //     if (item instanceof ol.interaction.DoubleClickZoom) {
    //         this.dblClickZoomInteraction = item;
    //         interactions.remove(item);
    //         break;
    //     }
    // }
};

P.PlotDraw.prototype.activateMapTools = function () {
    // if (this.dblClickZoomInteraction != null) {
    //     map.getInteractions().push(this.dblClickZoomInteraction);
    //     this.dblClickZoomInteraction = null;
    // }
};

P.PlotEdit = function(map,mapboxgl){
    if(!map || !mapboxgl){
        return;
    }
    goog.base(this, []);
    this.activePlot = null;
    this.startPoint = null;
    this.ghostControlPoints = null;
    this.controlPoints = null;
    this.map = map;
    this.mapboxgl = mapboxgl
    // this.mapViewport = this.map.getViewport();
    // change
    this.mapViewport = this.map.getCanvasContainer();
    this.mouseOver = false;
    this.elementTable = {};
    this.activeControlPointId = null;
    this.mapDragPan = null;
};

goog.inherits(P.PlotEdit, ol.Observable);

P.PlotEdit.prototype.Constants = {
    HELPER_HIDDEN_DIV: 'p-helper-hidden-div',
    HELPER_CONTROL_POINT_DIV: 'p-helper-control-point-div'
};

P.PlotEdit.prototype.initHelperDom = function(){
    if(!this.map || !this.activePlot){
        return;
    }
    var parent = this.getMapParentElement();
    if(!parent){
       return;
    }
    var hiddenDiv = P.DomUtils.createHidden('div', parent, this.Constants.HELPER_HIDDEN_DIV);

    var cPnts = this.getControlPoints();
    for(var i=0; i<cPnts.length; i++){
        var id = this.Constants.HELPER_CONTROL_POINT_DIV + '-' + i;
        P.DomUtils.create('div', this.Constants.HELPER_CONTROL_POINT_DIV, hiddenDiv, id);
        this.elementTable[id] = i;
    }
};

P.PlotEdit.prototype.getMapParentElement = function() {
    // var mapElement = this.map.getTargetElement();
    // change
    var mapElement = this.map.getContainer();
    if(!mapElement){
        return;
    }
    return mapElement.parentNode;
};

P.PlotEdit.prototype.destroyHelperDom = function(){
    //
    if(this.controlPoints){
        for(var i=0; i<this.controlPoints.length; i++){
            this.controlPoints[i].remove()
            // this.map.removeOverlay(this.controlPoints[i]);
            // var element = P.DomUtils.get(this.Constants.HELPER_CONTROL_POINT_DIV + '-' + i);
            // if(element){
            //     P.DomUtils.removeListener(element, 'mousedown', this.controlPointMouseDownHandler, this);
            //     P.DomUtils.removeListener(element, 'mousemove', this.controlPointMouseMoveHandler2, this);
            // }
        }
        this.controlPoints = null;
    }
    //
    var parent = this.getMapParentElement();
    var hiddenDiv = P.DomUtils.get(this.Constants.HELPER_HIDDEN_DIV);
    if(hiddenDiv && parent){
        P.DomUtils.remove(hiddenDiv, parent);
    }
};

P.PlotEdit.prototype.initControlPoints = function(){
    if(!this.map || !this.mapboxgl){
        return;
    }
    this.controlPoints = [];
    var cPnts = this.getControlPoints();
    for(var i=0; i<cPnts.length; i++){
        var id = this.Constants.HELPER_CONTROL_POINT_DIV + '-' + i;
        var element = P.DomUtils.get(id);
        var pnt = new this.mapboxgl.Marker({draggable: true}).setLngLat(cPnts[i]).addTo(this.map);
        this.controlPoints.push(pnt);
        // 添加监听
        // pnt.on('dragend',this.markerDragEndHandle(pnt))
        pnt.on('dragend',function(){
            window._PlotEdit.dispatchEvent(new P.Event.PlotEditEvent(P.Event.PlotEditEvent.DRAG_POINT_END,  window._PlotEdit.handleMarkerDragEvent()));
        })

        // pnt.on('drag',this.markerDragMoveHandle(pnt))
        pnt.on('drag',function(){
            // console.log(pnt.getLngLat())
            window._PlotEdit.dispatchEvent(new P.Event.PlotEditEvent(P.Event.PlotEditEvent.DRAG_POINT_MOVING,  window._PlotEdit.handleMarkerDragEvent()));
        })
        // this.map.addOverlay(pnt);      // P.DomUtils.addListener(element, 'mousedown', this.controlPointMouseDownHandler, this);
        // P.DomUtils.addListener(element, 'mousemove', this.controlPointMouseMoveHandler2, this);
    }
};


P.PlotEdit.prototype.handleMarkerDragEvent = function(){
    var points = []
    for(var i =0;i<window._PlotEdit.controlPoints.length;i++){
        points.push([window._PlotEdit.controlPoints[i].getLngLat().lng,window._PlotEdit.controlPoints[i].getLngLat().lat])
    }
    var feature  =   P.PlotFactory.createPlot(window._PlotEdit.plotType, points, null)
    var data = JSON.parse(JSON.stringify({
        type: 'Feature',
        properties: {
            id: P.Utils.uuid(),
            coordinates: feature.points,     //锚点坐标
            isplot:true,
            plotType:window._PlotEdit.plotType // 标绘类型
        },
        geometry: {
            coordinates: P.Utils.handleArray(feature.A,P.Utils.getFeatureType(feature.type)),
            type:P.Utils.getFeatureType(feature.type)
        }
    }))

   return data

}

P.PlotEdit.prototype.controlPointMouseMoveHandler2 = function(e){
    e.stopImmediatePropagation();
};

P.PlotEdit.prototype.controlPointMouseDownHandler = function(e){
    var id = e.target.id;
    this.activeControlPointId = id;
    goog.events.listen(this.mapViewport, P.Event.EventType.MOUSEMOVE, this.controlPointMouseMoveHandler, false, this);
    goog.events.listen(this.mapViewport, P.Event.EventType.MOUSEUP, this.controlPointMouseUpHandler, false, this);
};

P.PlotEdit.prototype.controlPointMouseMoveHandler = function(e){
    var coordinate = map.getCoordinateFromPixel([e.offsetX, e.offsetY]);
    if(this.activeControlPointId){
        var plot = this.activePlot;
        var index = this.elementTable[this.activeControlPointId];
        plot.updatePoint(coordinate, index);
        var overlay = this.map.getOverlayById(this.activeControlPointId);
        overlay.setPosition(coordinate);
    }
};

P.PlotEdit.prototype.controlPointMouseUpHandler = function(e){
    goog.events.unlisten(this.mapViewport, P.Event.EventType.MOUSEMOVE,
        this.controlPointMouseMoveHandler, false, this);
    goog.events.unlisten(this.mapViewport, P.Event.EventType.MOUSEUP,
        this.controlPointMouseUpHandler, false, this);
};

P.PlotEdit.prototype.activate = function(plot){

  /*  if(!plot || !(plot instanceof ol.Feature) || plot == this.activePlot) {
        return;
    }*/

    if(!plot['properties']['isplot']) {
        return;
    }

    // var geom = plot.getGeometry();
    // if(!geom.isPlot()){
    //     return;
    // }

    this.deactivate();

    this.plotType = plot['properties']['plotType'] // plot类型
    this.activePlot = new ol.Feature(P.PlotFactory.createPlot(plot['properties']['plotType'], JSON.parse(plot['properties']['coordinates']), null)) ;
    //
    window._PlotEdit = this;

    this.initHelperDom();
    //
    this.initControlPoints();
    //
    this.map.on("pointermove", this.plotMouseOverOutHandler);

};

P.PlotEdit.prototype.getControlPoints = function(){
    if(!this.activePlot){
        return [];
    }
    var geom = this.activePlot.getGeometry();
    return geom.getPoints();
};

P.PlotEdit.prototype.plotMouseOverOutHandler = function(e){
    var feature = map.queryRenderedFeatures(e.point)

    if(feature.length && feature == this.activePlot){
        if(!window._PlotEdit.mouseOver){
            window._PlotEdit.mouseOver = true;
            // this.map.getViewport().style.cursor = 'move';
            //change
            window._PlotEdit.map.getCanvasContainer().style.cursor = 'move';
            window._PlotEdit.map.on('pointerdown', window._PlotEdit.plotMouseDownHandler);
        }
    }else{
        if(window._PlotEdit.mouseOver){
            window._PlotEdit.mouseOver = false;
            //change
            window._PlotEdit.map.getCanvasContainer().style.cursor = 'default';
            window._PlotEdit.map.off('pointerdown', window._PlotEdit.plotMouseDownHandler);
        }
    }
};

P.PlotEdit.prototype.plotMouseDownHandler = function(e){
    window._PlotEdit.ghostControlPoints = window._PlotEdit.getControlPoints();
    window._PlotEdit.startPoint = e.coordinate;
    window._PlotEdit.disableMapDragPan();
    window._PlotEdit.map.on('pointerup', window._PlotEdit.plotMouseUpHandler);
    window._PlotEdit.map.on('pointerdrag', window._PlotEdit.plotMouseMoveHandler);
};

P.PlotEdit.prototype.plotMouseMoveHandler = function(e){
    var point = e.coordinate;
    var dx = point[0] - this.startPoint[0];
    var dy = point[1] - this.startPoint[1];
    var newPoints = [];
    for(var i=0; i<window._PlotEdit.ghostControlPoints.length; i++){
        var p = window._PlotEdit.ghostControlPoints[i];
        var coordinate = [p[0] + dx, p[1] + dy];
        newPoints.push(coordinate);
        var id = window._PlotEdit.Constants.HELPER_CONTROL_POINT_DIV + '-' + i;
        var overlay = window._PlotEdit.map.getOverlayById(id);
        overlay.setPosition(coordinate);
        overlay.setPositioning('center-center');
    }
    var plot = window._PlotEdit.activePlot.getGeometry();
    plot.setPoints(newPoints);
};

P.PlotEdit.prototype.plotMouseUpHandler = function(e){
    window._PlotEdit.enableMapDragPan();
    window._PlotEdit.map.off('pointerup', window._PlotEdit.plotMouseUpHandler);
    window._PlotEdit.map.off('pointerdrag', window._PlotEdit.plotMouseMoveHandler);
};

P.PlotEdit.prototype.disconnectEventHandlers = function () {
    this.map.off('pointermove', this.plotMouseOverOutHandler, this);
    goog.events.unlisten(this.mapViewport, P.Event.EventType.MOUSEMOVE,
        this.controlPointMouseMoveHandler, false, this);
    goog.events.unlisten(this.mapViewport, P.Event.EventType.MOUSEUP,
        this.controlPointMouseUpHandler, false, this);
    this.map.off('pointerdown', this.plotMouseDownHandler, this);
    this.map.off('pointerup', this.plotMouseUpHandler, this);
    this.map.off('pointerdrag', this.plotMouseMoveHandler, this);
};

P.PlotEdit.prototype.deactivate = function(){
    this.activePlot = null;
    this.mouseOver = false;
    this.destroyHelperDom();
    this.disconnectEventHandlers();
    this.elementTable = {};
    this.activeControlPointId = null;
    this.startPoint = null;
};

P.PlotEdit.prototype.disableMapDragPan = function () {
    // var interactions = this.map.getInteractions();
    // var length = interactions.getLength();
    // for (var i = 0; i < length; i++) {
    //     var item = interactions.item(i);
    //     if (item instanceof ol.interaction.DragPan) {
    //         this.mapDragPan = item;
    //         item.setActive(false);
    //         break;
    //     }
    // }
};

P.PlotEdit.prototype.enableMapDragPan = function () {
    // if (this.mapDragPan != null) {
    //     this.mapDragPan.setActive(true);
    //     this.mapDragPan = null;
    // }
};
