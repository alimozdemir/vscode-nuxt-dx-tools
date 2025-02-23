import { ExtensionContext, window, workspace, WorkspaceConfiguration, Disposable, ConfigurationTarget } from 'vscode';
import { ConfigurationKey } from '../types/configuration';

const multipleDefinitions = 'editor.gotoLocation.multipleDefinitions';
const confirmSetting = 'editor.gotoLocation.confirmPeek';

export async function prompt(name: string, e: ExtensionContext) {
  const config = workspace.getConfiguration();

  if (e.globalState.get(confirmSetting))
    {return;}
  
  if (config.inspect(multipleDefinitions)?.globalValue === 'goto' || config.get(multipleDefinitions) === 'goto') {
    return;
  }

  const response = await window.showInformationMessage(
    `
    [${name}]
    We recommend you to set ${multipleDefinitions} to 'goto' for better experience
    Click OK to set it now.
    `,
    'OK (global)',
    'OK (workspace)',
    'Never show again'
  );
  
  if (response === 'OK (workspace)') {
    await config.update(multipleDefinitions, 'goto');
  } else if (response === 'OK (global)') {
    await config.update(multipleDefinitions, 'goto', ConfigurationTarget.Global);
  } else if (response === 'Never show again') {
    e.globalState.update(confirmSetting, true);
  }
}

export async function reset() {
  const config = workspace.getConfiguration();
  config.update(confirmSetting, false);
}

const key = 'nuxtDxTools';

export class ConfigurationService implements Disposable {
  private config: WorkspaceConfiguration;
  private updateDisposable: Disposable;

  constructor() {
    this.config = workspace.getConfiguration(key);
    this.updateDisposable = 
      workspace.onDidChangeConfiguration(this.updateConfiguration, this);
  }

  dispose() {
    this.updateDisposable.dispose();
  }

  private updateConfiguration() {
    this.config = workspace.getConfiguration(key);
  }

  get<T>(path: ConfigurationKey): T | undefined {
    return this.config.get<T>(path);
  }

  async update(path: ConfigurationKey, value: any): Promise<void> {
    await this.config.update(path, value);
  }

  watch<T>(path: ConfigurationKey, callback: (value?: T) => void) {
    return workspace.onDidChangeConfiguration(e => {
      if (e.affectsConfiguration(`${key}.${path}`)) {
        callback(this.config.get<T>(path));
      } 
    });
  }
}