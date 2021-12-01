import Docker from 'dockerode';
import readline from 'readline';
import getPort from 'get-port';
import LocalStackService from './LocalStackService';

export default class LocalStackContainer {
    private static readonly EDGE_PORT: number = 4566;
    private readonly externalPort: number;
    private readonly container: Docker.Container;

    private constructor(externalPort: number, container: Docker.Container) {
        this.externalPort = externalPort;
        this.container = container;
    }

    public static async create(services: LocalStackService[]): Promise<LocalStackContainer> {
        const externalPort = await getPort();
        const container = await new Docker().createContainer({
            Image: 'localstack/localstack:0.12.15',
            AttachStdin: false,
            AttachStdout: true,
            AttachStderr: true,
            Tty: true,
            OpenStdin: false,
            StdinOnce: false,
            Env: LocalStackContainer.buildEnv(services),
            HostConfig: {
                PortBindings: LocalStackContainer.buildPortBindings(externalPort),
            },
        });

        await container.start();
        await LocalStackContainer.waitForContainerToStart(container);
        return new LocalStackContainer(externalPort, container);
    }

    public async destroy(): Promise<void> {
        if (this.container) {
            await this.container.remove({ force: true });
        }
    }

    private static buildEnv(services: LocalStackService[]): string[] {
        const env: string[] = ['USE_SSL=false'];
        if (services.length > 0) {
            env.push(`SERVICES=${services.join(',')}`);
        }
        return env;
    }

    private static buildPortBindings(externalPort: number): { [index: string]: any } {
        const portBindings: { [index: string]: any } = {};
        portBindings[`${LocalStackContainer.EDGE_PORT}/tcp`] = [{ HostPort: String(externalPort) }];
        return portBindings;
    }

    private static async waitForContainerToStart(container: Docker.Container): Promise<void> {
        const logs = await container.logs({
            follow: true,
            stdout: true,
            stderr: true,
        });

        const readLogs = readline.createInterface({
            input: logs,
        });

        return new Promise((resolve, reject) => {
            const timer = setTimeout(() => {
                reject('Localstack container not started.');
            }, 60000);

            readLogs.on('line', (line) => {
                if (line.indexOf('Ready.') >= 0) {
                    clearTimeout(timer);
                    resolve();
                }
            });
        });
    }

    public getEndpoint(): string {
        return `localhost:${this.externalPort}`;
    }
}
