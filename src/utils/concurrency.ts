export class Semaphore {
    private customQueue: (() => void)[] = [];
    private activeCount = 0;

    constructor(private readonly maxConcurrency: number) { }

    async acquire(): Promise<void> {
        if (this.activeCount < this.maxConcurrency) {
            this.activeCount++;
            return;
        }

        return new Promise<void>((resolve) => {
            this.customQueue.push(resolve);
        });
    }

    release(): void {
        if (this.customQueue.length > 0) {
            const nextResolve = this.customQueue.shift();
            if (nextResolve) {
                nextResolve();
            }
        } else {
            this.activeCount--;
        }
    }

    async run<T>(fn: () => Promise<T>): Promise<T> {
        await this.acquire();
        try {
            return await fn();
        } finally {
            this.release();
        }
    }
}
