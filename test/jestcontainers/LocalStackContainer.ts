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
            Image: 'localstack/localstack:2.1.0',
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

    private static buildPortBindings(externalPort: number): Record<string, Record<string, string>[]> {
        const portBindings: Record<string, Record<string, string>[]> = {};
        portBindings[`${LocalStackContainer.EDGE_PORT}/tcp`] = [{ HostPort: String(externalPort) }];
        return portBindings;
    }

    private static async waitForContainerToStart(container: Docker.Container): Promise<void> {
        const readLogs: readline.Interface = readline.createInterface({
            input: await container.logs({
                follow: true,
                stdout: true,
                stderr: true,
            }),
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

    public getHost(): string {
        return 'localhost';
    }

    public getPort(): string {
        return `${this.externalPort}`;
    }

    public setLocalstackProperties(): void {
        process.env.AWS_REGION = 'us-east-1';
        process.env.AWS_ACCESS_KEY_ID = 'access-key';
        process.env.AWS_SECRET_ACCESS_KEY = 'secret-key';
        process.env.LOCALSTACK_HOSTNAME = `${this.getHost()}`;
        process.env.EDGE_PORT = this.getPort();
        process.env.NODE_TLS_REJECT_UNAUTHORIZED = '0';
    }
}
