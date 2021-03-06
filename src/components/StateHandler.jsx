 /**
  * @jsx React.DOM
  */

var React = require('react'),
    urllite = require('urllite'),
    isMobile = require('ismobilejs');

var SearchComponent = require('./SearchComponent'),
    ResultsComponent = require('./ResultsComponent'),
    FeedbackComponent = require('./FeedbackComponent'),
    Sampler = require('react-sampler');

var PlaylistStore = require('../stores/PlaylistStore'),
    SearchStore = require('../stores/SearchStore');

var PlaylistActions = require('../actions/PlaylistActions'),
    SearchActions = require('../actions/SearchActions');

var samples = [{
  file: '/static/audio/horn.mp3',
  key: 'h', // horn
  startAt: 0.2 //seconds, obvs
},{
  file: '/static/audio/orch5.wav',
  key: 'o', // orchestra hit
  startAt: 0.05
},{
  file: '/static/audio/rimshot.mp3',
  key: 's' // rimshot
},{
  file: '/static/audio/cowbell.mp3',
  key: 'c' // cowbell
},{
  file: '/static/audio/gun.mp3',
  key: 'g' // gun shot
},{
  file: '/static/audio/reload.wav',
  key: 'r' // reload!
},{
  file: '/static/audio/machinegun.mp3',
  key: 'm' // machine gun
}];

var StateHandler = React.createClass({
  getInitialState: function(){
    return {
      playlist: PlaylistStore.getPlaylist(),
      results: SearchStore.getVideos(),
      recentTerms: SearchStore.getRecentTerms(),
      position: PlaylistStore.getPosition(),
      playlistId: PlaylistStore.getPlaylistId(),
      sync: false,
      currentQuery: SearchStore.getCurrentQuery(),
      showFeedbackForm: false,
      hdOnly: false,
      repeatAll: false
    }
  },

  componentWillMount: function(){
    PlaylistStore.addChangeListener(this._onChange);
    SearchStore.addChangeListener(this._onChange);

    var url = urllite(document.location.href),
        that = this,
        id;

    // if you're accessing via a mobile device and there are parties for your IP
    // you'll be automatically added to the parteh
    if(window.DATA.playlists && window.DATA.playlists.length){
      id = window.DATA.playlists[0];
      history.pushState(null, null, '/'+id);

      this.setState({sync: true});
      PlaylistActions.sync(id);

    } else if(url.pathname.length > 1){
      // direct link to a playlist
      // do a server request with url.hash
      id = url.pathname.slice(1);
      PlaylistActions.load(id);
    }

    // using hashchanges for the query searches
    window.onhashchange = function(){
      var q = location.hash.slice(1);
      if(q){
        SearchActions.search(q, that.state.hdOnly ? 'high' : 'any');
      } else {
        SearchActions.resetResults();
      }
    }

  },

  componentDidMount: function(){
    if(location.hash){
      window.dispatchEvent(new CustomEvent('hashchange'));
    }
  },

  toggleRepeatAll: function(){
    var repeatAll = !this.state.repeatAll;
    this.setState({repeatAll: repeatAll});
    console.log('repeatAll is now '+repeatAll);
  },

  toggleSync: function(){
    var sync = !this.state.sync;

    if(sync){
      if(!this.state.playlistId)
        PlaylistActions.createAndSync(this.state.playlist);
      else
        PlaylistActions.sync(this.state.playlistId);

    } else {
      PlaylistActions.unsync();
    }

    this.setState({sync: sync});
  },

  setPlaylist: function(pl){ console.log('set playlist', pl)
    PlaylistActions.changedPlaylist(this.state.playlistId, pl, this.state.position);
  },

  setPosition: function(p){ console.log('set position', p)
    PlaylistActions.changedPlaylist(this.state.playlistId, this.state.playlist, p);
  },

  playerReady: function(){
    var that = this;
    if(this.state.playlist.length){
      setTimeout(function(){
        that.setPosition(that.state.position === -1 ? 0 : that.state.position);
      }, 50);
    }
  },

  _onChange: function() {
    this.setState({
      playlist: PlaylistStore.getPlaylist(),
      playlistId: PlaylistStore.getPlaylistId(),
      position: PlaylistStore.getPosition(),
      sync: (PlaylistStore.getPlaylistId() ? this.state.sync : false),
      results: SearchStore.getVideos(),
      currentQuery: SearchStore.getCurrentQuery(),
      recentTerms: SearchStore.getRecentTerms(),
    });
  },

  handleSavePlaylist: function(fn){
    PlaylistActions.save(this.state.playlist, this.state.playlistId, fn);
  },

  hideFeedbackForm: function(){
    this.setState({showFeedbackForm: false});
  },

  showFeedbackForm: function(e){
    this.setState({showFeedbackForm: true});
    return false;
  },

  changeQuery: function(q){
    this.setState({currentQuery: q});
  },

  setHdOnly: function(hdOnly){
    this.setState({hdOnly: hdOnly});
    SearchActions.search(this.state.currentQuery, hdOnly ? 'high' : 'any');
  },

  render: function(){
    return (
      <div id="app">
        <div id="search-component">
          <SearchComponent
            results={this.state.results}
            setResults={this.setResults}
            handleSavePlaylist={this.handleSavePlaylist}
            mode={this.state.mode}
            playlistId={this.state.playlistId}
            toggleRepeatAll={this.toggleRepeatAll}
            repeatAll={this.state.repeatAll}
            toggleSync={this.toggleSync}
            sync={this.state.sync}
            recentTerms={this.state.recentTerms}
            currentQuery={this.state.currentQuery}
            changeQuery={this.changeQuery}
            setHdOnly={this.setHdOnly}
            />
        </div>
        <div id="player-component">
          <ResultsComponent
            playlist={this.state.playlist}
            setPlaylist={this.setPlaylist}
            position={this.state.position}
            setPosition={this.setPosition}
            repeatAll={this.state.repeatAll}
            onPlayerReady={this.playerReady}
            mode={this.state.mode} />
        </div>
        <a id="github-link" href="https://github.com/ruiramos/greatdj" target="_blank" className="desktop">GreatDJ on GitHub</a>
        <Sampler samples={samples} />
      </div>
    )
  }
});

 /**
         <a id="feedback-link" href="#feedback" className="desktop hide" onClick={this.showFeedbackForm}>Send feedback!</a>
        <FeedbackComponent
          show={this.state.showFeedbackForm}
          handleDispose={this.hideFeedbackForm}
        />
  **/

React.render(
  <StateHandler />,
  document.body
);

module.exports = StateHandler;

