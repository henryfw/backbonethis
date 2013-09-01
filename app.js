var Code = Backbone.Model.extend({
    collection : null,
    collectionName : "",
    model : null,
    modelName : null,
    router : null,
    view : null,
    template: null,
    getCollection : function() {
        return "\nvar " + fixCase( this.get('collectionName'), 'class' ) + " = Backbone.Collection.extend(" + 
                jsonStringify( this.get('collection') ) +
                ");";
    },
    getModel : function() {
        return "\nvar " + fixCase( this.get('modelName'), 'class' ) + " = Backbone.Model.extend(" + 
                jsonStringify( this.get('model') ) +
                ");";
    },
    getRouter : function() {
        var template = _.template($('#router-template').html(), {
            templateName : this.get('collectionName').toLowerCase(),
            collectionInstanceName : fixCase( this.get('collectionName'), 'instance' ),
        });
        return template;
    },
    getTemplate: function() {   
        var template = _.template($('#template-template').html(), {
            fields : this.get('model').defaults,
            templateName : this.get('collectionName').toLowerCase()
        });
        return template.replace(/xscriptx/g, 'script').replace(/x\%x/g, '%'); 
    },
    getView : function() {    
        var template = _.template($('#view-template').html(), { 
            collectionInstanceName : fixCase( this.get('collectionName'), 'instance' ),
            collectionName : fixCase( this.get('collectionName'), 'class' ),
            templateName : ( this.get('collectionName') ).toLowerCase(),
            modelName : fixCase( this.get('modelName'), 'class' ),
            modelInstanceName : fixCase( this.get('modelName'), 'instance' )
        });
        return template; 
    }
});

var PageView = Backbone.View.extend({
    el : $('#input-container'),
    cm : null, // codemirror obj
    events: {
      'click .input-form-button': 'backboneThis',
      'click .output-preview-button': 'showPreview',
      'click .output-preview-source-button': 'showPreviewSource',
      'click .select-all-btn': 'selectAll'
    },
    backboneThis : function() {
        this.cm.save();
        
        var jsonObj;
        try {
            jsonObj = eval( '(' +  $('.input-form-textarea').val() + ')' ); 
        }
        catch(e) {
            alert("Error parsing JSON.");
            return;
        }  

        var collectionName = "";
        var collectionObj = null;
        var collectionModel = null;
        var modelName = "";

        for (var i in jsonObj) { 
            collectionName = i;
            collectionObj = jsonObj[i];
            if (typeof collectionObj.model != "undefined") {
                for (var j in collectionObj.model) { 
                    modelName = j; 
                    collectionModel = $.extend({}, collectionObj.model[j]);
                    break;
                }
                delete collectionObj.model;
            }
            break;
        } 

        if (!collectionModel) {
            alert("Model is undefined");
            return;
        }

        if ( fixCase( collectionName , 'class') == fixCase( modelName, 'class') ) { 
            alert("The collection and model name are the same.");
            return;
        }

        if (typeof collectionModel.urlRoot == "undefined" && typeof collectionModel.url == "undefined") {
            if (collectionObj.url) {
                collectionModel.urlRoot = collectionObj.url;
            }
        } 
        
        var code = new Code({
            collection : collectionObj,
            collectionName : collectionName,
            model : collectionModel,
            modelName : modelName
        });

        var template = _.template($('#output-template').html(), { code: code }); 
        $('#output-container').html(template);
        
        $('body').scrollTo('#output-container'); 
         
    },
    render: function () {  
        var template = _.template($('#input-form-template').html(), 
            { sampleCode : $('#sample-json-template').html() } 
        ); 
        this.$el.html(template); 
        
        
        this.cm = CodeMirror.fromTextArea( $(".input-form-textarea", this.$el)[0] , {
            indentUnit : 4,
            mode: 'javascript',
            smartIndent: true,
            theme: 'solarized dark'
        });
        this.cm.setSize(  750,  500 );

    },
    generatePreview : function(showAsSource) {
        var template = _.template($('#preview-template').html(), { 
            template: "<!-- Templates -->\n" + $( '#output-textarea-template', this.$el).val() ,
            script : "\n/* Collection */\n" + $( '#output-textarea-collection', this.$el).val() + 
                    "\n/* Model */\n" + $( '#output-textarea-model', this.$el).val() + 
                    "\n/* View */\n" + $( '#output-textarea-view', this.$el).val() + 
                    "\n/* Router */\n" + $( '#output-textarea-router', this.$el).val()
        }).replace(/xscriptx/g, 'script'); 
        var w = window.open();
        if (showAsSource) {
            template = "<textarea style='width:100%;height:100%;border:0;outline:none'>" + template + "</textarea>";
        }
        return template; 
    },
    selectAll : function(e) {
        var textarea =  $(e.currentTarget).parent().next('textarea');
        textarea.selectAll();
    },
    showPreview : function() { 
        var w = window.open(); 
        w.document.write(this.generatePreview());
        w.document.close();  
    },
    showPreviewSource : function() {
        var w = window.open(); 
        w.document.write(this.generatePreview(true));
        w.document.close();  
    }
}); 
var pageView = new PageView(); 

var Router = Backbone.Router.extend({
    routes: { 
      "": "start"
    }
});

var router = new Router;
router.on('route:start', function() { 
    pageView.render(); 
});   

Backbone.history.start(); 