import videojs from 'video.js';
const MenuItem = videojs.getComponent('MenuItem');
const Component = videojs.getComponent('Component');

class SourceMenuItem extends MenuItem {
  constructor(player, options) {
    options.selectable = true;
    options.multiSelectable = false;

    super(player, options);
  }

  handleClick() {
    let selected = this.options_;
    console.log('Changing quality to:', selected.label);
    super.handleClick();

    let levels = this.player().qualityLevels();
    let isAuto = selected.index === levels.length;
    for (let i = 0; i < levels.length; i++) {
      if (isAuto) {
        // If this is the Auto option, enable all renditions for adaptive selection
        levels[i].enabled = true;
      } else if (selected.index === i) {
        levels[i].enabled = true;
      } else {
        levels[i].enabled = false;
      }
    }
    if (isAuto) {
      this.deselectRest(0);
    } else {
      this.deselectRest(selected.index + 1);
    }
  }

  deselectRest(idx) {
    if (this.parentComponent_) {
      this.parentComponent_.children().forEach((item, i) => {
        item.selected(idx === i);
      });
    }
  }

  update() {
    let selectedIndex = this.player().qualityLevels().selectedIndex;
    this.selected(this.options_.index === selectedIndex);
  }
}

Component.registerComponent('SourceMenuItem', SourceMenuItem);
export default SourceMenuItem;
