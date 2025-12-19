
import { Container } from './container/container';

class Application extends Container {
  private readonly version = '1.0.0';

  public init() {
    this.addInstance('app', this);
  }
}

export { Application };