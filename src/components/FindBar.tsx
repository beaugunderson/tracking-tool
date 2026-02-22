import React from 'react';

interface FindBarState {
  visible: boolean;
  searchText: string;
  activeMatch: number;
  totalMatches: number;
}

export class FindBar extends React.Component<{}, FindBarState> {
  private removeOnFind: (() => void) | null = null;
  private removeOnResult: (() => void) | null = null;
  private inputRef = React.createRef<HTMLInputElement>();

  state: FindBarState = {
    visible: false,
    searchText: '',
    activeMatch: 0,
    totalMatches: 0,
  };

  componentDidMount() {
    this.removeOnFind = window.trackingTool.onFindRequested(() => {
      this.setState({ visible: true }, () => {
        this.inputRef.current?.focus();
        this.inputRef.current?.select();
      });
    });

    this.removeOnResult = window.trackingTool.onFindResult((result) => {
      this.setState({
        activeMatch: result.activeMatchOrdinal,
        totalMatches: result.matches,
      });
    });
  }

  componentWillUnmount() {
    this.removeOnFind?.();
    this.removeOnResult?.();
  }

  handleClose = () => {
    window.trackingTool.stopFindInPage();
    this.setState({ visible: false, searchText: '', activeMatch: 0, totalMatches: 0 });
  };

  handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const text = e.target.value;
    this.setState({ searchText: text });
    if (text) {
      window.trackingTool.findInPage(text);
    } else {
      window.trackingTool.stopFindInPage();
      this.setState({ activeMatch: 0, totalMatches: 0 });
    }
  };

  handleNext = () => {
    if (this.state.searchText) {
      window.trackingTool.findInPage(this.state.searchText, { forward: true, findNext: true });
    }
  };

  handlePrev = () => {
    if (this.state.searchText) {
      window.trackingTool.findInPage(this.state.searchText, { forward: false, findNext: true });
    }
  };

  handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Escape') {
      this.handleClose();
    } else if (e.key === 'Enter') {
      if (e.shiftKey) {
        this.handlePrev();
      } else {
        this.handleNext();
      }
    }
  };

  render() {
    if (!this.state.visible) return null;

    const { activeMatch, searchText, totalMatches } = this.state;

    return (
      <div
        id="find-bar"
        style={{
          position: 'fixed',
          top: 10,
          right: 10,
          zIndex: 9999,
          background: '#fff',
          border: '1px solid #ccc',
          borderRadius: 4,
          padding: '6px 8px',
          display: 'flex',
          alignItems: 'center',
          gap: 6,
          boxShadow: '0 2px 8px rgba(0,0,0,0.15)',
        }}
      >
        <input
          ref={this.inputRef}
          value={searchText}
          onChange={this.handleChange}
          onKeyDown={this.handleKeyDown}
          placeholder="Find in page..."
          style={{ width: 200, padding: '4px 8px', border: '1px solid #ddd', borderRadius: 3 }}
        />
        <span style={{ fontSize: 12, minWidth: 50, textAlign: 'center', color: '#666' }}>
          {searchText ? `${activeMatch}/${totalMatches}` : ''}
        </span>
        <button
          type="button"
          onClick={this.handlePrev}
          disabled={!searchText}
          style={{ cursor: 'pointer' }}
        >
          &#9650;
        </button>
        <button
          type="button"
          onClick={this.handleNext}
          disabled={!searchText}
          style={{ cursor: 'pointer' }}
        >
          &#9660;
        </button>
        <button type="button" onClick={this.handleClose} style={{ cursor: 'pointer' }}>
          &#10005;
        </button>
      </div>
    );
  }
}
