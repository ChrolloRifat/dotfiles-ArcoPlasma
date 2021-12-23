# -*- coding: utf-8 -*-

# Form implementation generated from reading ui file 'build/dist/designer/support_dialog.ui'
#
# Created by: PyQt5 UI code generator 5.15.4
#
# WARNING: Any manual changes made to this file will be lost when pyuic5 is
# run again.  Do not edit this file unless you know what you are doing.


from PyQt5 import QtCore, QtGui, QtWidgets


class Ui_support_dialog(object):
    def setupUi(self, support_dialog):
        support_dialog.setObjectName("support_dialog")
        support_dialog.resize(400, 300)
        support_dialog.setMinimumSize(QtCore.QSize(400, 300))
        support_dialog.setMaximumSize(QtCore.QSize(400, 300))
        self.verticalLayout = QtWidgets.QVBoxLayout(support_dialog)
        self.verticalLayout.setObjectName("verticalLayout")
        self.label = QtWidgets.QLabel(support_dialog)
        self.label.setAlignment(QtCore.Qt.AlignCenter)
        self.label.setWordWrap(True)
        self.label.setObjectName("label")
        self.verticalLayout.addWidget(self.label)
        spacerItem = QtWidgets.QSpacerItem(20, 40, QtWidgets.QSizePolicy.Minimum, QtWidgets.QSizePolicy.Expanding)
        self.verticalLayout.addItem(spacerItem)
        self.giovanniButton = QtWidgets.QPushButton(support_dialog)
        font = QtGui.QFont()
        font.setPointSize(16)
        self.giovanniButton.setFont(font)
        self.giovanniButton.setObjectName("giovanniButton")
        self.verticalLayout.addWidget(self.giovanniButton)
        self.glutanimateButton = QtWidgets.QPushButton(support_dialog)
        font = QtGui.QFont()
        font.setPointSize(14)
        self.glutanimateButton.setFont(font)
        self.glutanimateButton.setObjectName("glutanimateButton")
        self.verticalLayout.addWidget(self.glutanimateButton)
        spacerItem1 = QtWidgets.QSpacerItem(20, 40, QtWidgets.QSizePolicy.Minimum, QtWidgets.QSizePolicy.Expanding)
        self.verticalLayout.addItem(spacerItem1)
        self.label_4 = QtWidgets.QLabel(support_dialog)
        self.label_4.setWordWrap(True)
        self.label_4.setObjectName("label_4")
        self.verticalLayout.addWidget(self.label_4)
        spacerItem2 = QtWidgets.QSpacerItem(20, 40, QtWidgets.QSizePolicy.Minimum, QtWidgets.QSizePolicy.Expanding)
        self.verticalLayout.addItem(spacerItem2)
        self.buttonBox = QtWidgets.QDialogButtonBox(support_dialog)
        self.buttonBox.setOrientation(QtCore.Qt.Horizontal)
        self.buttonBox.setStandardButtons(QtWidgets.QDialogButtonBox.Close)
        self.buttonBox.setObjectName("buttonBox")
        self.verticalLayout.addWidget(self.buttonBox)

        self.retranslateUi(support_dialog)
        self.buttonBox.accepted.connect(support_dialog.accept)
        self.buttonBox.rejected.connect(support_dialog.reject)
        QtCore.QMetaObject.connectSlotsByName(support_dialog)

    def retranslateUi(self, support_dialog):
        _translate = QtCore.QCoreApplication.translate
        support_dialog.setWindowTitle(_translate("support_dialog", "Support Our Work"))
        self.label.setText(_translate("support_dialog", "<html><head/><body><p>Hi there :) !</p><p>Thanks a bunch for using Anki Simulator!</p><p>If you\'ve found the add-on to be useful, please consider <span style=\" font-weight:600;\">supporting</span> our work by using the buttons below:</p></body></html>"))
        self.giovanniButton.setText(_translate("support_dialog", "Buy GiovanniHenriksen a coffee"))
        self.glutanimateButton.setText(_translate("support_dialog", "Support Glutanimate on Patreon"))
        self.label_4.setText(_translate("support_dialog", "<html><head/><body><p>Your support is much appreciated and will help us <span style=\" font-weight:600;\">maintain and improve</span> Anki Simulator as time goes by!</p></body></html>"))