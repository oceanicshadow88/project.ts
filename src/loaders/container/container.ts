class Container {
  private readonly bindings: Map<string, any> = new Map();

  private readonly instances: Map<string, any> = new Map();

  public register<T>(token: string, instance: T): void {
    this.bindings.set(token, instance);
  }

  public resolve<T>(token: string): T {
    const instance = this.bindings.get(token);
    if (!instance) {
      throw new Error(`No provider found for "${token}"`);
    }
    return instance;
  }

  public addInstance<T>(token: string, instance: T): this {
    this.instances.set(token, instance);
    return this;
  }
}

export { Container };