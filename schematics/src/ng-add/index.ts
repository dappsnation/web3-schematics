/**
 * Source code uses this example : https://nitayneeman.com/posts/making-an-addable-angular-package-using-schematics/
 * Checkout ngadd : https://github.com/angular/angular/blob/master/packages/elements/schematics/ng-add/index.ts
 */
import { Schema } from './schema';
import { NodePackageInstallTask } from '@angular-devkit/schematics/tasks';
import {
  Rule,
  chain,
  noop,
  Tree,
  SchematicContext,
  apply,
  url,
  template,
  SchematicsException,
  mergeWith,
  move
} from '@angular-devkit/schematics';
import {
  NodeDependency,
  NodeDependencyType,
  addPackageJsonDependency,
  getWorkspace,
  getProjectFromWorkspace
} from 'schematics-utilities';

export default function(opts: Schema): Rule {
  return chain([
    opts && opts.skipPackageJson ? noop() : addWeb3(),
    opts && opts.skipPackageJson ? noop() : installWeb3(),
    addWebpackConfig(),
    addCustomBuilders(opts),
    addInjectionToken(opts),
    addInjectionToken(opts)
  ]);
}

/** Add Web3 to package.json */
function addWeb3(): Rule {
  return (host: Tree, context: SchematicContext) => {
    const dependancies: NodeDependency[] = [{
      type: NodeDependencyType.Default,
      version: '1.0.0-beta.36',
      name: 'web3'
    }, {
      type: NodeDependencyType.Dev,
      version: 'latest',
      name: '@angular-builders/custom-webpack'
    }, {
      type: NodeDependencyType.Dev,
      version: 'latest',
      name: '@angular-builders/dev-server'
    }];
    dependancies.forEach(deps => {
      addPackageJsonDependency(host, deps);
      context.logger.log('info', `✅️ Added '${deps.name}' into ${deps.type}`);
    });
    return host;
  };
}

/** Install packages */
function installWeb3(): Rule {
  return (host: Tree, context: SchematicContext) => {
    context.addTask(new NodePackageInstallTask());
    context.logger.log('info', `🔍 Installing packages...`);
    return host;
  };
}

/** Add a webpack.config.js file with config for Web3 */
function addWebpackConfig() {
  return (host: Tree, context: SchematicContext) => {
    host.create(`${host.root.path}/webpack.config.js`, webpackConfig);
    context.logger.log('info', `✅️ Created Webpack Config`);
    return host;
  };
}

/** Add custom builders in angular.json */
function addCustomBuilders(opts: Schema) {
  return (host: Tree, context: SchematicContext) => {
    try {
      const ws = getWorkspace(host);
      const projectName = opts.project || ws.defaultProject;
      const project = getProjectFromWorkspace(ws, projectName);
      if (!project.architect) {
        throw new SchematicsException(`Cannot find project ${projectName}`);
      }

      // Change angular.json config to use custom builders
      project.architect.build.builder = '@angular-builders/custom-webpack:browser';
      project.architect.serve.builder = '@angular-builders/dev-server:generic';
      host.overwrite('angular.json', JSON.stringify(ws, null, 2));
      context.logger.log('info', `✅️ Added custom builders for ${project}`);
    } catch (e) {
      context.logger.log('error', `🚫 Failed to add custom builders`);
    }
    return host;
  };
}

function addInjectionToken(opts: Schema): Rule {
  return (host: Tree, context: SchematicContext) => {
    const ws = getWorkspace(host);
    const projectName = opts.project || ws.defaultProject;
    const project = getProjectFromWorkspace(ws, projectName);

    context.logger.log('info', `✅️ add web3 in ${project.sourceRoot}/app`);
    return mergeWith(
      apply(url('./files'), [
        template({}),
        move('/', `${project.sourceRoot}/app`)
      ])
    );
  };
}


/* TEMPLATES */
const webpackConfig = `module.exports = {
  node: {
    crypto: true,
    path: true,
    os: true,
    stream: true,
    buffer: true
  }
}`;
