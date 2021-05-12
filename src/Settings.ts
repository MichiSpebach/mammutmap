
class Settings {

  private zoomSpeed: number = 3

  public getZoomSpeed(): number {
    return this.zoomSpeed
  }

  public setZoomSpeed(zoomSpeed: number) {
    this.zoomSpeed = zoomSpeed
  }

}

export const settings = new Settings()
